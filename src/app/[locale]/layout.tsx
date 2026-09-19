import "@/app/globals.css";

import Script from "next/script";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { AppContextProvider } from "@/contexts/app";
import { NextAuthSessionProvider } from "@/auth/session";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/providers/theme";
import { cn } from "@/lib/utils";
import VerificationModal from "@/components/verification-modal";
import Analytics from "@/components/analytics";
import NextTopLoader from "nextjs-toploader";
import { Metadata } from "next";
import { buildLanguageAlternates } from "@/lib/seo";
import { Inter, Source_Serif_4, Noto_Sans_SC } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-source-serif",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  // force-static 渲染下无参调用回落 defaultLocale,须显式传 locale
  const t = await getTranslations({ locale });

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
      languages: buildLanguageAlternates("/"),
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

  // 同上:静态渲染下 getMessages() 须显式传 locale,否则 client 侧翻译整体回落英文
  const messages = await getMessages({ locale });
  const googleAdsenseCode = process.env.NEXT_PUBLIC_GOOGLE_ADCODE || "";
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        {googleAdsenseCode && (
          <meta name="google-adsense-account" content={googleAdsenseCode} />
        )}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={cn(inter.variable, sourceSerif.variable, notoSansSC.variable, "font-sans antialiased")}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${webUrl}/#organization`,
                  name: "AI Story",
                  url: webUrl,
                  logo: `${webUrl}/logo.avif`,
                },
                {
                  "@type": "WebSite",
                  "@id": `${webUrl}/#website`,
                  url: webUrl,
                  name: "AI Story",
                  inLanguage: locale,
                  publisher: { "@id": `${webUrl}/#organization` },
                },
              ],
            }),
          }}
        />
        {clarityId && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityId}");
              `,
            }}
          />
        )}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NextAuthSessionProvider>
            <AppContextProvider>
              <ThemeProvider>
                {children}
                {/* 顶部路由加载进度条:primary 品牌色,点击导航到新页面渲染前的空档给用户即时反馈 */}
                <NextTopLoader
                  color="#2456d6"
                  shadow="0 0 10px rgba(36,86,214,0.5), 0 0 5px rgba(36,86,214,0.35)"
                  height={3}
                />
                <VerificationModal />
                <Analytics />
              </ThemeProvider>
            </AppContextProvider>
          </NextAuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
