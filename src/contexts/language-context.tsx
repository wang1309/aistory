"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { locales, defaultLocale } from "@/i18n/locale";

interface LanguageContextType {
  currentLocale: string;
  isChanging: boolean;
  changeLanguage: (newLocale: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "app-locale-preference";
const LANGUAGE_COOKIE_KEY = "app-locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const serverLocale = useLocale();
  const [clientLocale, setClientLocale] = useState<string>(serverLocale);
  const [isChanging, setIsChanging] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize client locale from localStorage or server locale
  useEffect(() => {
    // Only run after mounting and on client side
    if (!mounted || typeof window === "undefined") {
      return;
    }

    try {
      const savedLocale = localStorage.getItem(LANGUAGE_STORAGE_KEY);

      // Validate saved locale
      if (savedLocale && locales.includes(savedLocale)) {
        setClientLocale(savedLocale);

        // If saved locale is different from server locale, update URL
        if (savedLocale !== serverLocale) {
          const currentPath = window.location.pathname;
          // Extract path without locale prefix
          const localePattern = new RegExp(`^/(${locales.join('|')})`);
          const pathWithoutLocale = currentPath.replace(localePattern, '');

          // Delay navigation to prevent flash
          setTimeout(() => {
            router.replace(pathWithoutLocale || '/', { locale: savedLocale });
          }, 100);
        }
      } else {
        setClientLocale(serverLocale);
      }
    } catch (error) {
      console.warn("Failed to read locale from localStorage:", error);
      setClientLocale(serverLocale);
    }
  }, [mounted, serverLocale, router]);

  const changeLanguage = async (newLocale: string) => {
    if (!locales.includes(newLocale) || newLocale === clientLocale || isChanging) {
      return;
    }

    setIsChanging(true);

    try {
      // Save to both localStorage and cookie
      if (typeof window !== "undefined") {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
        // Set cookie for server-side access
        document.cookie = `${LANGUAGE_COOKIE_KEY}=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      }

      // Update client state immediately for better UX
      setClientLocale(newLocale);

      // Get current path without locale prefix
      const currentPath = window.location.pathname;
      const localePattern = new RegExp(`^/(${locales.join('|')})`);
      const pathWithoutLocale = currentPath.replace(localePattern, '');

      // Navigate to new locale
      await router.replace(pathWithoutLocale || '/', { locale: newLocale });
    } catch (error) {
      console.error("Failed to change language:", error);
      // Revert on error
      setClientLocale(serverLocale);
      if (typeof window !== "undefined") {
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        // Remove cookie on error
        document.cookie = `${LANGUAGE_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
      }
    } finally {
      setIsChanging(false);
    }
  };

  const value: LanguageContextType = {
    currentLocale: clientLocale,
    isChanging,
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