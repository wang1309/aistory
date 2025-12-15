import { defaultLocale, locales as defaultLocales } from "@/i18n/locale";

export function buildLanguageAlternates(
  pathname: string,
  options?: {
    locales?: readonly string[];
    baseUrl?: string;
    includeXDefault?: boolean;
  }
): Record<string, string> {
  const locales = options?.locales ?? defaultLocales;
  const baseUrl = (options?.baseUrl ?? process.env.NEXT_PUBLIC_WEB_URL ?? "").replace(
    /\/$/,
    ""
  );

  const normalized = pathname === "/" || pathname === "" ? "" : pathname;
  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;

  const result: Record<string, string> = {};

  for (const loc of locales) {
    result[loc] = `${baseUrl}${loc === defaultLocale ? "" : `/${loc}`}${path}`;
  }

  if (options?.includeXDefault !== false) {
    result["x-default"] = `${baseUrl}${path}`;
  }

  return result;
}
