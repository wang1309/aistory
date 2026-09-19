import "@/app/globals.css";

import Script from "next/script";
import { MdOutlineHome } from "react-icons/md";
import { Metadata } from "next";
import React from "react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: {
      template: `%s | ${t("metadata.title")}`,
      default: t("metadata.title"),
    },
    description: t("metadata.description"),
    keywords: t("metadata.keywords"),
  };
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleAdsenseCode = process.env.NEXT_PUBLIC_GOOGLE_ADCODE || "";
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        {googleAdsenseCode && (
          <meta name="google-adsense-account" content={googleAdsenseCode} />
        )}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={cn(inter.variable, sourceSerif.variable, notoSansSC.variable, "font-sans antialiased")}>
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
                  inLanguage: "en",
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
        <div>
          <a
            className="text-base-content cursor-pointer hover:opacity-80 transition-opacity"
            href="/"
          >
            <MdOutlineHome className="text-2xl mx-8 my-8" />
            {/* <img className="w-10 h-10 mx-4 my-4" src="/logo.png" /> */}
          </a>
          <div className="text-md max-w-3xl mx-auto leading-loose pt-4 pb-8 px-8 prose prose-slate dark:prose-invert prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-base-content prose-code:text-base-content prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
