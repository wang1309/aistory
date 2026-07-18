"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useOpenPanel } from "@openpanel/nextjs";
import { useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";
import {
  getCreativeLimit,
  isCreativeQuotaError,
  useCreativeQuota,
} from "@/lib/creative-quota-client";
import {
  shouldOptimisticallyGateCreativeCreditUsage,
  shouldOptimisticallyGateCreativeAnonymousUsage,
  type CreativePageKey,
} from "@/lib/creative-quota-core";
import { buildCreativeQuotaSignInTrackingPayload } from "@/lib/creative-tracking";

export function useCreativeQuotaPage(pageKey: CreativePageKey) {
  const { requireAuth, user } = useAppContext();
  const { track } = useOpenPanel();
  const t = useTranslations("story_paywall");
  const quota = useCreativeQuota(pageKey);
  const { setUsed } = quota;
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [leftCredits, setLeftCredits] = useState<number | null>(null);
  const [creditCost, setCreditCost] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/creative-quota/status?page=${encodeURIComponent(pageKey)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((status) => {
        if (!cancelled && status && typeof status.used === "number") {
          setUsed(status.used);
          setLeftCredits(
            typeof status.leftCredits === "number" ? status.leftCredits : null
          );
          setCreditCost(
            typeof status.creditCost === "number" && status.creditCost > 0
              ? status.creditCost
              : null
          );
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
        toast.error(t("title"));
        setPaywallOpen(true);
        return true;
      }

      return false;
    },
    [pageKey, quota, requireAuth, t, track]
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

  const guardCreativeCreditQuota = useCallback(
    ({ selectedModel }: { selectedModel: string | null | undefined }) => {
      if (
        !shouldOptimisticallyGateCreativeCreditUsage({
          hasUser: !!user,
          selectedModel,
          used: quota.used,
          limit: getCreativeLimit(),
          credits: leftCredits,
          cost: creditCost,
        })
      ) {
        return false;
      }

      toast.error(t("title"));
      setPaywallOpen(true);
      return true;
    },
    [creditCost, leftCredits, quota.used, t, user]
  );

  const increment = useCallback(() => {
    const charged = quota.used >= getCreativeLimit();
    const next = quota.increment();

    if (charged && creditCost !== null) {
      setLeftCredits((current) =>
        current === null ? null : Math.max(0, current - creditCost)
      );
    }

    return next;
  }, [creditCost, quota]);

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
    creditCost,
    handleQuotaError,
    guardCreativeCreditQuota,
    shouldBlockBeforeRequest,
    guardAnonymousCreativeQuota,
    anonymousCreativeExhausted,
    increment,
  };
}
