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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const serverLocale = useLocale();
  const [clientLocale, setClientLocale] = useState<string>(serverLocale);
  const [isChanging, setIsChanging] = useState(false);

  // Initialize client locale from localStorage or server locale
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
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

            // Navigate to saved locale
            router.replace(pathWithoutLocale || '/', { locale: savedLocale });
          }
        } else {
          setClientLocale(serverLocale);
        }
      } catch (error) {
        console.warn("Failed to read locale from localStorage:", error);
        setClientLocale(serverLocale);
      }
    }
  }, [serverLocale, router]);

  const changeLanguage = async (newLocale: string) => {
    if (!locales.includes(newLocale) || newLocale === clientLocale || isChanging) {
      return;
    }

    setIsChanging(true);

    try {
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
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