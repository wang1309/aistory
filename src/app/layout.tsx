import "@/app/globals.css";

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

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {googleAdsenseCode && (
          <meta name="google-adsense-account" content={googleAdsenseCode} />
        )}

        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={cn(dmSans.variable, sourceSerif.variable, notoSansSC.variable, "font-sans antialiased")}>
        {children}
      </body>
    </html>
  );
}
