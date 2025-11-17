"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { locales, defaultLocale } from "@/i18n/locale";

interface LanguageContextType {
  currentLocale: string;
  isChanging: boolean;
  isInitialized: boolean;
  changeLanguage: (newLocale: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "app-locale-preference";
const LANGUAGE_COOKIE_KEY = "app-locale";

// Helper function to read cookies
const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;

  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  } catch {
    return null;
  }
};

// Helper function to get initial locale from URL
const getLocaleFromURL = (): string => {
  if (typeof window === "undefined") return defaultLocale;

  try {
    const path = window.location.pathname;
    const localePattern = new RegExp(`^/(${locales.join('|')})`);
    const match = path.match(localePattern);
    return match?.[1] || defaultLocale;
  } catch {
    return defaultLocale;
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const serverLocale = useLocale();
  const [currentLocale, setCurrentLocale] = useState<string>(defaultLocale);
  const [isChanging, setIsChanging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize locale on mount
  useEffect(() => {
    const getInitialLocale = (): string => {
      // Priority 1: Get locale from current URL
      const urlLocale = getLocaleFromURL();
      if (urlLocale !== defaultLocale) {
        return urlLocale;
      }

      // Priority 2: Get locale from cookie
      const cookieLocale = getCookie(LANGUAGE_COOKIE_KEY);
      if (cookieLocale && locales.includes(cookieLocale) && cookieLocale !== defaultLocale) {
        return cookieLocale;
      }

      // Priority 3: Get locale from localStorage
      if (typeof window !== "undefined") {
        try {
          const storageLocale = localStorage.getItem(LANGUAGE_STORAGE_KEY);
          if (storageLocale && locales.includes(storageLocale) && storageLocale !== defaultLocale) {
            return storageLocale;
          }
        } catch {
          // Ignore localStorage errors
        }
      }

      // Priority 4: Use server locale or default
      return serverLocale || defaultLocale;
    };

    const initialLocale = getInitialLocale();
    setCurrentLocale(initialLocale);
    setIsInitialized(true);

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("Language initialization:", {
        urlLocale: getLocaleFromURL(),
        cookieLocale: getCookie(LANGUAGE_COOKIE_KEY),
        serverLocale,
        selectedLocale: initialLocale
      });
    }
  }, [serverLocale]);

  // Sync with URL changes (when user navigates directly or uses browser back/forward)
  useEffect(() => {
    if (!isInitialized) return;

    const handleRouteChange = () => {
      const urlLocale = getLocaleFromURL();
      if (urlLocale !== currentLocale) {
        setCurrentLocale(urlLocale);
      }
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [currentLocale, isInitialized]);

  const changeLanguage = async (newLocale: string) => {
    if (!locales.includes(newLocale) || newLocale === currentLocale || isChanging) {
      return;
    }

    setIsChanging(true);

    try {
      // Update state immediately for better UX
      setCurrentLocale(newLocale);

      // Save to both localStorage and cookie
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
        } catch {
          // Ignore localStorage errors
        }

        // Set cookie for server-side access
        document.cookie = `${LANGUAGE_COOKIE_KEY}=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      }

      // Get current path without locale prefix
      const currentPath = window.location.pathname;
      const localePattern = new RegExp(`^/(${locales.join('|')})`);
      const pathWithoutLocale = currentPath.replace(localePattern, '');

      // Navigate to new locale
      await router.replace(pathWithoutLocale || '/', { locale: newLocale });
    } catch (error) {
      console.error("Failed to change language:", error);

      // Revert state on error
      setCurrentLocale(currentLocale);

      // Remove saved preferences on error
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        } catch {
          // Ignore localStorage errors
        }
        document.cookie = `${LANGUAGE_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
      }
    } finally {
      setIsChanging(false);
    }
  };

  const value: LanguageContextType = {
    currentLocale,
    isChanging,
    isInitialized,
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}