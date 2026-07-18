"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useOpenPanel } from "@openpanel/nextjs";
import { useAppContext } from "@/contexts/app";
import {
  getCreativeLimit,
  isCreativeQuotaError,
  useCreativeQuota,
} from "@/lib/creative-quota-client";
import {
  shouldOptimisticallyGateCreativeAnonymousUsage,
  type CreativePageKey,
} from "@/lib/creative-quota-core";
import { buildCreativeQuotaSignInTrackingPayload } from "@/lib/creative-tracking";

export function useCreativeQuotaPage(pageKey: CreativePageKey) {
  const { requireAuth, user } = useAppContext();
  const { track } = useOpenPanel();
  const quota = useCreativeQuota(pageKey);
  const { setUsed } = quota;
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/creative-quota/status?page=${encodeURIComponent(pageKey)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((status) => {
        if (!cancelled && status && typeof status.used === "number") {
          setUsed(status.used);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pageKey, setUsed, user?.uuid]);

  const handleQuotaError = useCallback(
    (status: number, data: unknown): boolean => {
      if (isCreativeQuotaError(status, data, "free_quota_exceeded")) {
        quota.exhaust();
        track(
          "creative_quota_sign_in_cta_click",
          buildCreativeQuotaSignInTrackingPayload(
            pageKey,
            "backend_fallback"
          )
        );
        toast.error("Daily free Creative quota reached. Please sign in to continue.");
        requireAuth({
          source: "ai_write",
          action: "continue_writing",
          sourcePage: pageKey,
        });
        return true;
      }

      if (isCreativeQuotaError(status, data, "insufficient_credits")) {
        toast.error("Insufficient credits. Please upgrade to continue.");
        setPaywallOpen(true);
        return true;
      }

      return false;
    },
    [pageKey, quota, requireAuth, track]
  );

  const shouldBlockBeforeRequest = useCallback(
    (selectedModel: string | null | undefined) =>
      shouldOptimisticallyGateCreativeAnonymousUsage({
        hasUser: !!user,
        selectedModel,
        used: quota.used,
        limit: getCreativeLimit(),
      }),
    [quota.used, user]
  );

  const guardAnonymousCreativeQuota = useCallback(
    ({
      selectedModel,
      message,
    }: {
      selectedModel: string | null | undefined;
      message: string;
    }) => {
      if (!shouldBlockBeforeRequest(selectedModel)) return false;

      track(
        "creative_quota_sign_in_cta_click",
        buildCreativeQuotaSignInTrackingPayload(pageKey, "optimistic")
      );
      toast.error(message);
      requireAuth({
        source: "ai_write",
        action: "continue_writing",
        sourcePage: pageKey,
      });
      return true;
    },
    [pageKey, requireAuth, shouldBlockBeforeRequest, track]
  );

  const anonymousCreativeExhausted =
    shouldOptimisticallyGateCreativeAnonymousUsage({
      hasUser: !!user,
      selectedModel: "creative",
      used: quota.used,
      limit: getCreativeLimit(),
    });

  return {
    ...quota,
    paywallOpen,
    setPaywallOpen,
    handleQuotaError,
    shouldBlockBeforeRequest,
    guardAnonymousCreativeQuota,
    anonymousCreativeExhausted,
  };
}
