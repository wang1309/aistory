"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useOpenPanel } from "@openpanel/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";
import {
  getQuotaCreditCost,
  getQuotaErrorTier,
  getQuotaLimit,
  isCreativeQuotaError,
  useQuotaMirror,
} from "@/lib/creative-quota-client";
import {
  getCreativeQuotaLimitReachedMessage,
  isQuotaTier,
  shouldOptimisticallyGateCreativeCreditUsage,
  shouldOptimisticallyGateCreativeAnonymousUsage,
  type CreativePageKey,
  type QuotaTier,
} from "@/lib/creative-quota-core";
import { buildCreativeQuotaSignInTrackingPayload } from "@/lib/creative-tracking";

type TierServerState = {
  limit: number | null;
  creditCost: number | null;
};

export type ModelQuotaSnapshot = {
  tier: QuotaTier;
  used: number;
  /** null = 尚未从 status API 确认真实 limit */
  limit: number | null;
  effectiveLimit: number;
  remaining: number;
  exhausted: boolean;
  anonymousExhausted: boolean;
  /** null = 尚未从 status API 确认真实成本 */
  creditCost: number | null;
  effectiveCreditCost: number;
  mode: "free" | "credits";
};

function defaultServerState(): Record<QuotaTier, TierServerState> {
  return {
    standard: { limit: null, creditCost: null },
    creative: { limit: null, creditCost: null },
  };
}

export function useCreativeQuotaPage(pageKey: CreativePageKey) {
  const { requireAuth, user } = useAppContext();
  const { track } = useOpenPanel();
  const locale = useLocale();
  const t = useTranslations("story_paywall");
  const mirror = useQuotaMirror(pageKey);
  const { setTierUsed } = mirror;

  const [server, setServer] =
    useState<Record<QuotaTier, TierServerState>>(defaultServerState);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [leftCredits, setLeftCredits] = useState<number | null>(null);
  const lastGuardedModelRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/creative-quota/status?page=${encodeURIComponent(pageKey)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((status) => {
        if (cancelled || !status) return;

        const applyTier = (tier: QuotaTier, data: unknown) => {
          if (!data || typeof data !== "object") return;
          const payload = data as {
            used?: unknown;
            limit?: unknown;
            creditCost?: unknown;
          };
          if (typeof payload.used === "number") {
            setTierUsed(tier, payload.used);
          }
          setServer((prev) => ({
            ...prev,
            [tier]: {
              limit:
                typeof payload.limit === "number" && payload.limit > 0
                  ? payload.limit
                  : prev[tier].limit,
              creditCost:
                typeof payload.creditCost === "number" &&
                payload.creditCost > 0
                  ? payload.creditCost
                  : prev[tier].creditCost,
            },
          }));
        };

        if (status.tiers) {
          applyTier("standard", status.tiers.standard);
          applyTier("creative", status.tiers.creative);
        } else if (typeof status.used === "number") {
          // Backward compatibility with the creative-only payload.
          applyTier("creative", status);
        }

        setLeftCredits(
          typeof status.leftCredits === "number" ? status.leftCredits : null
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pageKey, setTierUsed, user?.uuid]);

  const forModel = useCallback(
    (model: string | null | undefined): ModelQuotaSnapshot | null => {
      if (!isQuotaTier(model)) return null;

      const used = mirror.used[model];
      const tierServer = server[model];
      const effectiveLimit = tierServer.limit ?? getQuotaLimit(model);
      const creditCost = tierServer.creditCost;
      const effectiveCreditCost =
        creditCost ?? getQuotaCreditCost(model);
      const exhausted = used >= effectiveLimit;

      return {
        tier: model,
        used,
        limit: tierServer.limit,
        effectiveLimit,
        remaining: Math.max(0, effectiveLimit - used),
        exhausted,
        anonymousExhausted: !user && exhausted,
        creditCost,
        effectiveCreditCost,
        mode: exhausted ? "credits" : "free",
      };
    },
    [mirror.used, server, user]
  );

  const creativeTier = forModel("creative");
  // Backward-compatible creative aliases for pages that have not migrated yet.
  const used = creativeTier?.used ?? 0;
  const limit = creativeTier?.limit ?? null;
  const creditCost = creativeTier?.creditCost ?? null;
  const anonymousCreativeExhausted =
    creativeTier?.anonymousExhausted ?? false;

  const handleQuotaError = useCallback(
    (status: number, data: unknown): boolean => {
      if (isCreativeQuotaError(status, data, "free_quota_exceeded")) {
        const tier =
          getQuotaErrorTier(data) ??
          (isQuotaTier(lastGuardedModelRef.current)
            ? lastGuardedModelRef.current
            : "creative");
        const effectiveLimit = server[tier].limit ?? getQuotaLimit(tier);
        mirror.exhaustTier(tier, effectiveLimit);
        track(
          "creative_quota_sign_in_cta_click",
          buildCreativeQuotaSignInTrackingPayload(
            pageKey,
            "backend_fallback"
          )
        );
        toast.error(getCreativeQuotaLimitReachedMessage(locale));
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
    [locale, mirror, pageKey, requireAuth, server, t, track]
  );

  const shouldBlockBeforeRequest = useCallback(
    (selectedModel: string | null | undefined) => {
      const snapshot = forModel(selectedModel);
      return shouldOptimisticallyGateCreativeAnonymousUsage({
        hasUser: !!user,
        selectedModel,
        used: snapshot?.used ?? 0,
        limit: snapshot?.effectiveLimit ?? 0,
      });
    },
    [forModel, user]
  );

  const guardAnonymousCreativeQuota = useCallback(
    ({
      selectedModel,
      message,
    }: {
      selectedModel: string | null | undefined;
      message: string;
    }) => {
      lastGuardedModelRef.current = selectedModel ?? null;
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
      lastGuardedModelRef.current = selectedModel ?? null;
      const snapshot = forModel(selectedModel);

      if (
        !shouldOptimisticallyGateCreativeCreditUsage({
          hasUser: !!user,
          selectedModel,
          used: snapshot?.used ?? 0,
          limit: snapshot?.effectiveLimit ?? 0,
          credits: leftCredits,
          cost: snapshot?.creditCost ?? null,
        })
      ) {
        return false;
      }

      toast.error(t("title"));
      setPaywallOpen(true);
      return true;
    },
    [forModel, leftCredits, t, user]
  );

  const increment = useCallback(
    (model?: string | null) => {
      const requested =
        model === undefined
          ? lastGuardedModelRef.current ?? "creative"
          : model;
      if (!isQuotaTier(requested)) return 0;

      const snapshot = forModel(requested);
      if (!snapshot) return 0;

      const charged = snapshot.exhausted;
      const next = mirror.incrementTier(
        requested,
        snapshot.effectiveLimit
      );

      if (charged && snapshot.creditCost !== null) {
        setLeftCredits((current) =>
          current === null
            ? null
            : Math.max(0, current - snapshot.creditCost!)
        );
      }

      return next;
    },
    [forModel, mirror]
  );

  const exhaust = useCallback(
    (model?: string | null) => {
      const requested =
        model === undefined
          ? lastGuardedModelRef.current ?? "creative"
          : model;
      if (!isQuotaTier(requested)) return;
      mirror.exhaustTier(
        requested,
        server[requested].limit ?? getQuotaLimit(requested)
      );
    },
    [mirror, server]
  );

  return {
    // creative aliases (kept for backward compatibility)
    used,
    limit,
    creditCost,
    setUsed: (n: number) => mirror.setTierUsed("creative", n),
    anonymousCreativeExhausted,
    // tier-aware API
    tiers: mirror.used,
    forModel,
    increment,
    exhaust,
    // shared UI state / guards
    paywallOpen,
    setPaywallOpen,
    handleQuotaError,
    guardAnonymousCreativeQuota,
    guardCreativeCreditQuota,
    shouldBlockBeforeRequest,
  };
}

export type CreativeQuotaPageState = ReturnType<typeof useCreativeQuotaPage>;
