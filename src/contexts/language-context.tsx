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
  const [isChanging, setIsChanging] = useState(false);

  // Use server locale as the single source of truth to avoid sync issues
  const currentLocale = serverLocale;

  const changeLanguage = async (newLocale: string) => {
    if (!locales.includes(newLocale) || newLocale === currentLocale || isChanging) {
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

      // Get current path without locale prefix
      const currentPath = window.location.pathname;
      const localePattern = new RegExp(`^/(${locales.join('|')})`);
      const pathWithoutLocale = currentPath.replace(localePattern, '');

      // Navigate to new locale immediately
      await router.replace(pathWithoutLocale || '/', { locale: newLocale });
    } catch (error) {
      console.error("Failed to change language:", error);
      // Remove saved preferences on error
      if (typeof window !== "undefined") {
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        document.cookie = `${LANGUAGE_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
      }
    } finally {
      setIsChanging(false);
    }
  };

  const value: LanguageContextType = {
    currentLocale,
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