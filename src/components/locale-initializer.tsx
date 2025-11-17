"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { locales, defaultLocale } from "@/i18n/locale";

const LANGUAGE_COOKIE_KEY = "app-locale";

// Helper function to read cookies safely
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

// Helper function to get locale from current URL
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

export function LocaleInitializer() {
  const router = useRouter();
  const serverLocale = useLocale();

  useEffect(() => {
    // Only run on client side and once
    if (typeof window === "undefined") return;

    // Small delay to ensure LanguageProvider has initialized
    const timer = setTimeout(() => {
      try {
        const currentUrlLocale = getLocaleFromURL();
        const cookieLocale = getCookie(LANGUAGE_COOKIE_KEY);
        const validCookieLocale = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : null;

        // Only redirect if:
        // 1. We have a valid cookie locale
        // 2. Current URL is default locale (no prefix)
        // 3. Cookie locale is different from default
        if (validCookieLocale &&
            currentUrlLocale === defaultLocale &&
            validCookieLocale !== defaultLocale) {

          // Extract current path without locale (should be just the path)
          const currentPath = window.location.pathname;
          const pathWithoutLocale = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;

          // Navigate to the saved locale
          router.replace(pathWithoutLocale, { locale: validCookieLocale });
        }
      } catch (error) {
        console.error("LocaleInitializer error:", error);
      }
    }, 100); // Small delay to avoid race conditions

    return () => clearTimeout(timer);
  }, [serverLocale, router]);

  // This component doesn't render anything
  return null;
}