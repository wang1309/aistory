import {
  defaultLocale,
  localeDetection,
  localePrefix,
  locales,
} from "./locale";

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix,
  localeDetection: true, // Enable locale detection for better cookie support
});
