import "@/app/globals.css";

import Script from "next/script";
import { getLocale, setRequestLocale } from "next-intl/server";
import { cn } from "@/lib/utils";
import { DM_Sans, Source_Serif_4, Noto_Sans_SC } from "next/font/google";

// DM Sans — 几何感温暖的无衬线字体，适合创意工具
const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Source Serif 4 — 编辑风格的衬线 display 字体
const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-source-serif",
  display: "swap",
});

// Noto Sans SC — 简体中文
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  setRequestLocale(locale);
  const googleAdsenseCode = process.env.NEXT_PUBLIC_GOOGLE_ADCODE || "";
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  // Microsoft Clarity Project ID（在 .env.* 中配置 NEXT_PUBLIC_CLARITY_ID）
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
        className={cn(dmSans.variable, sourceSerif.variable, notoSansSC.variable, "font-sans antialiased")}
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
        {children}
      </body>
    </html>
  );
}
