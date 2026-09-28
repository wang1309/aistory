"use client";

import googleOneTap from "google-one-tap";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { isAuthEnabled, isGoogleOneTapEnabled } from "@/lib/auth";

export default function useOneTapLogin() {
  const { status } = useSession();
  const initialized = useRef(false);

  const handleLogin = useCallback(async (credentials: string) => {
    await signIn("google-one-tap", {
      credential: credentials,
      redirect: false,
    });
  }, []);

  const oneTapLogin = useCallback(() => {
    const options = {
      client_id: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
      auto_select: false,
      cancel_on_tap_outside: false,
      context: "signin",
    };

    googleOneTap(options, (response: any) => {
      void handleLogin(response.credential);
    });
  }, [handleLogin]);

  useEffect(() => {
    if (
      !isAuthEnabled() ||
      !isGoogleOneTapEnabled() ||
      status !== "unauthenticated"
    ) {
      return;
    }

    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const initializeOnce = () => {
      if (initialized.current) return;
      initialized.current = true;

      for (const event of events) {
        window.removeEventListener(event, initializeOnce);
      }
      oneTapLogin();
    };

    for (const event of events) {
      window.addEventListener(event, initializeOnce, { once: true, passive: true });
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, initializeOnce);
      }
    };
  }, [oneTapLogin, status]);
}
