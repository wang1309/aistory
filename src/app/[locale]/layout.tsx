import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { AppContextProvider } from "@/contexts/app";
import { LanguageProvider } from "@/contexts/language-context";
import { LocaleInitializer } from "@/components/locale-initializer";
import { Metadata } from "next";
import { NextAuthSessionProvider } from "@/auth/session";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/providers/theme";
import StructuredData from "@/components/seo/structured-data";
import VerificationModal from "@/components/verification-modal";
import Analytics from "@/components/analytics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "storiesgenerator.org";
  const title = t("metadata.title") || "";
  const description = t("metadata.description") || "";
  const siteName = t("metadata.siteName") || "AI Story Generator";
  const canonicalUrl = `${webUrl}${locale === "en" ? "" : `/${locale}`}`;

  return {
    title: {
      template: `%s`,
      default: title,
    },
    description: description,
    keywords: t("metadata.keywords") || "",
    alternates: {
      canonical: canonicalUrl,
    },

    // Open Graph metadata
    openGraph: {
      title: title,
      description: description,
      url: `${webUrl}/${locale === "en" ? "" : locale}`,
      siteName: siteName,
      locale: locale,
      type: "website",
      images: [
        {
          url: `${webUrl}/share.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter Card metadata
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [`${webUrl}/share.png`],
      creator: "@wangrui69490224",
      site: "@wangrui69490224",
    },

    // Additional metadata
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Verification (if you have these)
    verification: {
      // google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html>
      <head>
        <StructuredData locale={locale} type="WebApplication" />
        <StructuredData locale={locale} type="FAQPage" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <NextAuthSessionProvider>
            <AppContextProvider>
              <LanguageProvider>
                <LocaleInitializer />
                <ThemeProvider>
                  {children}
                  <VerificationModal />
                  <Analytics />
                </ThemeProvider>
              </LanguageProvider>
            </AppContextProvider>
          </NextAuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
