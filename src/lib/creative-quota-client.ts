"use client";

/**
 * standard / creative 每日免费额度的客户端 localStorage 镜像。
 *
 * 后端 KV 是真实计数源,前端 localStorage 仅用于 UI 即时反馈(不等网络)。
 * 跟后端 FREE_STANDARD_DAILY_LIMIT / FREE_CREATIVE_DAILY_LIMIT 默认值(3)
 * 与 getTodayUtcKey 保持一致,跨 UTC 天自动重置。
 * 跨设备/清缓存会与后端短暂不一致,可接受(MVP)。
 */

import { useCallback, useEffect, useState } from "react";
import type { CreativePageKey, QuotaTier } from "@/lib/creative-quota-core";
import {
  incrementCreativeUsedCount,
  isQuotaTier,
} from "@/lib/creative-quota-core";

export const DEFAULT_QUOTA_LIMITS: Record<QuotaTier, number> = {
  standard: 3,
  creative: 3,
};

export const DEFAULT_QUOTA_CREDIT_COSTS: Record<QuotaTier, number> = {
  standard: 3,
  creative: 5,
};

const DEFAULT_TIER: QuotaTier = "creative";
const STORAGE_PREFIX = "creative_quota:";
const LEGACY_STORAGE_PREFIX = "creative_quota_";

function getTodayUtcKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getKey(pageKey: CreativePageKey, tier: QuotaTier): string {
  return `${STORAGE_PREFIX}${pageKey}:${tier}:${getTodayUtcKey()}`;
}

function getLegacyPageKey(pageKey: CreativePageKey): string {
  return `${STORAGE_PREFIX}${pageKey}:${getTodayUtcKey()}`;
}

function getLegacyStoryKey(): string {
  return `${LEGACY_STORAGE_PREFIX}${getTodayUtcKey()}`;
}

export function getQuotaLimit(tier: QuotaTier = DEFAULT_TIER): number {
  return DEFAULT_QUOTA_LIMITS[tier];
}

export function getCreativeLimit(): number {
  return getQuotaLimit("creative");
}

export function getQuotaCreditCost(tier: QuotaTier = DEFAULT_TIER): number {
  return DEFAULT_QUOTA_CREDIT_COSTS[tier];
}

export function getQuotaUsed(
  pageKey: CreativePageKey = "story-generator",
  tier: QuotaTier = DEFAULT_TIER
): number {
  if (typeof window === "undefined") return 0;
  try {
    const key = getKey(pageKey, tier);
    let v = window.localStorage.getItem(key);

    // Migrate the old creative-only key into the tiered key once.
    if (!v && tier === "creative") {
      v = window.localStorage.getItem(getLegacyPageKey(pageKey));
      if (!v && pageKey === "story-generator") {
        v = window.localStorage.getItem(getLegacyStoryKey());
      }
      if (v) window.localStorage.setItem(key, v);
    }

    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

export function getCreativeUsed(
  pageKey: CreativePageKey = "story-generator"
): number {
  return getQuotaUsed(pageKey, "creative");
}

export function markQuotaUsed(
  n: number,
  pageKey: CreativePageKey = "story-generator",
  tier: QuotaTier = DEFAULT_TIER
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getKey(pageKey, tier), String(Math.max(0, n)));
  } catch {
    // ignore
  }
}

export function markCreativeUsed(
  n: number,
  pageKey: CreativePageKey = "story-generator"
): void {
  markQuotaUsed(n, pageKey, "creative");
}

/** 生成成功后 +1,返回新的已用次数 */
export function markQuotaIncrement(
  pageKey: CreativePageKey = "story-generator",
  tier: QuotaTier = DEFAULT_TIER,
  limit: number = getQuotaLimit(tier)
): number {
  const next = incrementCreativeUsedCount(getQuotaUsed(pageKey, tier), limit);
  markQuotaUsed(next, pageKey, tier);
  return next;
}

export function markCreativeIncrement(
  pageKey: CreativePageKey = "story-generator",
  limit: number = getQuotaLimit("creative")
): number {
  return markQuotaIncrement(pageKey, "creative", limit);
}

/** 后端返回 429 时,同步本地为已用完 */
export function markQuotaExhausted(
  pageKey: CreativePageKey = "story-generator",
  tier: QuotaTier = DEFAULT_TIER,
  limit: number = getQuotaLimit(tier)
): void {
  markQuotaUsed(limit, pageKey, tier);
}

export function markCreativeQuotaExhausted(
  pageKey: CreativePageKey = "story-generator",
  limit: number = getQuotaLimit("creative")
): void {
  markQuotaExhausted(pageKey, "creative", limit);
}

export function isQuotaExhausted(
  pageKey: CreativePageKey = "story-generator",
  tier: QuotaTier = DEFAULT_TIER,
  limit: number = getQuotaLimit(tier)
): boolean {
  return getQuotaUsed(pageKey, tier) >= limit;
}

export function isCreativeExhausted(
  pageKey: CreativePageKey = "story-generator",
  limit: number = getQuotaLimit("creative")
): boolean {
  return isQuotaExhausted(pageKey, "creative", limit);
}

export type QuotaMirrorState = Record<QuotaTier, number>;

export function useQuotaMirror(pageKey: CreativePageKey) {
  const [used, setUsedState] = useState<QuotaMirrorState>({
    standard: 0,
    creative: 0,
  });

  useEffect(() => {
    setUsedState({
      standard: getQuotaUsed(pageKey, "standard"),
      creative: getQuotaUsed(pageKey, "creative"),
    });
  }, [pageKey]);

  const setTierUsed = useCallback(
    (tier: QuotaTier, n: number) => {
      markQuotaUsed(n, pageKey, tier);
      setUsedState((prev) =>
        prev[tier] === n ? prev : { ...prev, [tier]: n }
      );
    },
    [pageKey]
  );

  const incrementTier = useCallback(
    (tier: QuotaTier, limit: number = getQuotaLimit(tier)) => {
      const next = markQuotaIncrement(pageKey, tier, limit);
      setUsedState((prev) =>
        prev[tier] === next ? prev : { ...prev, [tier]: next }
      );
      return next;
    },
    [pageKey]
  );

  const exhaustTier = useCallback(
    (tier: QuotaTier, limit: number = getQuotaLimit(tier)) => {
      markQuotaExhausted(pageKey, tier, limit);
      setUsedState((prev) =>
        prev[tier] === limit ? prev : { ...prev, [tier]: limit }
      );
    },
    [pageKey]
  );

  return { used, setTierUsed, incrementTier, exhaustTier };
}

export function useCreativeQuota(pageKey: CreativePageKey) {
  const mirror = useQuotaMirror(pageKey);

  return {
    used: mirror.used.creative,
    setUsed: (n: number) => mirror.setTierUsed("creative", n),
    increment: (limit?: number) =>
      mirror.incrementTier("creative", limit ?? getQuotaLimit("creative")),
    exhaust: (limit?: number) =>
      mirror.exhaustTier("creative", limit ?? getQuotaLimit("creative")),
  };
}

export function isCreativeQuotaError(
  status: number,
  data: unknown,
  code: "free_quota_exceeded" | "insufficient_credits"
): boolean {
  if (status !== 429 && status !== 402) return false;
  return (
    !!data &&
    typeof data === "object" &&
    (data as { code?: unknown }).code === code
  );
}

export function getQuotaErrorTier(data: unknown): QuotaTier | null {
  if (!data || typeof data !== "object") return null;
  const tier = (data as { tier?: unknown }).tier;
  if (typeof tier !== "string" || !isQuotaTier(tier)) return null;
  return tier;
}
