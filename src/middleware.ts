import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "./i18n/locale";

const LANGUAGE_COOKIE_KEY = "app-locale";

// Enhanced middleware with cookie-based locale detection
export default function middleware(request: NextRequest) {
  // Try to get locale from cookie first
  const cookieLocale = request.cookies.get(LANGUAGE_COOKIE_KEY)?.value;

  // Validate cookie locale
  const validCookieLocale = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : null;

  // If we have a valid cookie locale and it's different from the path locale,
  // redirect to the correct locale to prevent flash
  if (validCookieLocale) {
    const pathname = request.nextUrl.pathname;

    // Extract locale from current path
    const pathLocale = locales.find(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

    // If current path locale doesn't match cookie locale, redirect
    if (pathLocale && pathLocale !== validCookieLocale) {
      const pathWithoutLocale = pathname.replace(new RegExp(`^/${pathLocale}`), '') || '/';
      const newUrl = new URL(`/${validCookieLocale}${pathWithoutLocale}`, request.url);
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
