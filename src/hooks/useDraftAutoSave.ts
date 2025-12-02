"use client";

import { useEffect, useRef } from "react";

interface UseDraftAutoSaveOptions {
  key: string;
  value: string;
  onRestore: (draft: string) => void;
  enabled?: boolean;
  debounceMs?: number;
}

export function useDraftAutoSave(options: UseDraftAutoSaveOptions) {
  const { key, value, onRestore, enabled = true, debounceMs = 1000 } = options;

  const hasRestoredRef = useRef(false);
  const initialValueRef = useRef(value);

  // Restore draft once on mount
  useEffect(() => {
    if (!enabled) return;
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { value?: unknown } | null;
      const draft = typeof parsed?.value === "string" ? parsed.value : null;
      if (!draft) return;

      if (initialValueRef.current && initialValueRef.current.trim().length > 0) {
        return;
      }

      onRestore(draft);
    } catch {
      // ignore
    }
  }, [key, onRestore, enabled]);

  // Persist draft with debounce
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      try {
        const trimmed = value.trim();
        if (!trimmed) {
          window.localStorage.removeItem(key);
          return;
        }

        const payload = {
          value,
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        // ignore
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [key, value, enabled, debounceMs]);
}
