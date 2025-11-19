import { Pathnames } from "next-intl/routing";

export const locales = ["en", "zh", "de", "ko", "ja", "ru"];

export const localeNames: any = {
  en: "English",
  zh: "中文",
  de: "Deutsch",
  ko: "한국어",
  ja: "日本語",
  ru: "Русский",
};

export const localeFlags: any = {
  en: "🇺🇸",
  zh: "🇨🇳",
  de: "🇩🇪",
  ko: "🇰🇷",
  ja: "🇯🇵",
  ru: "🇷🇺",
};

export const defaultLocale = "en";

export const localePrefix = "as-needed";

export const localeDetection =
  process.env.NEXT_PUBLIC_LOCALE_DETECTION === "true";
