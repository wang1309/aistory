import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "./i18n/locale";

const LANGUAGE_COOKIE_KEY = "app-locale";

// Enhanced middleware with proper default locale handling
export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Extract locale from current path
  const pathLocale = locales.find(locale =>
    pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If path has no locale prefix, it's using the default locale (English)
  const currentLocale = pathLocale || defaultLocale;

  // Try to get locale from cookie
  const cookieLocale = request.cookies.get(LANGUAGE_COOKIE_KEY)?.value;
  const validCookieLocale = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : null;

  // Only redirect if:
  // 1. We have a valid cookie locale
  // 2. Current locale is different from cookie locale
  // 3. We're not already on the default locale (English) without a prefix
  // 4. The path is not already correct for the cookie locale
  if (validCookieLocale &&
      currentLocale !== validCookieLocale &&
      !(currentLocale === defaultLocale && !pathLocale)) {

    // Extract path without current locale prefix
    let pathWithoutLocale = pathname;
    if (pathLocale) {
      pathWithoutLocale = pathname.replace(new RegExp(`^/${pathLocale}`), '') || '/';
    }

    // Build new URL with the cookie locale
    let newPath = pathWithoutLocale;
    // Only add locale prefix if it's not the default locale
    if (validCookieLocale !== defaultLocale) {
      newPath = `/${validCookieLocale}${pathWithoutLocale}`;
    }

    // Only redirect if the new path is different from current
    if (newPath !== pathname) {
      const newUrl = new URL(newPath, request.url);
      return NextResponse.redirect(newUrl);
    }
  }

  // Use default next-intl middleware behavior
  return createMiddleware(routing)(request);
}

export const config = {
  matcher: [
    "/",
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    "/((?!privacy-policy|terms-of-service|api/|_next|_vercel|.*\\..*).*)",
  ],
};
