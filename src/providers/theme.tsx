"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import dynamic from "next/dynamic";
import { ReactNode, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Toaster } from "sonner";
import { isAuthEnabled } from "@/lib/auth";
import SignModal from "@/components/sign/modal";

const Analytics = dynamic(() => import("@/components/analytics"), {
  ssr: false,
  loading: () => null,
});

const Adsense = dynamic(() => import("./adsense"), {
  ssr: false,
  loading: () => null,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [showThirdParty, setShowThirdParty] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => setShowThirdParty(true);
    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(load, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const timer = setTimeout(load, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={process.env.NEXT_PUBLIC_DEFAULT_THEME || "system"}
      enableSystem
      disableTransitionOnChange
    >
      {children}

      <Toaster position="top-center" richColors />

      {showThirdParty && <Analytics />}

      {isAuthEnabled() && <SignModal />}

      {showThirdParty && <Adsense />}
    </NextThemesProvider>
  );
}
