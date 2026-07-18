"use client";

/**
 * creative 每日免费额度的客户端 localStorage 镜像。
 *
 * 后端 KV 是真实计数源,前端 localStorage 仅用于 UI 即时反馈(不等网络)。
 * 跟后端 FREE_CREATIVE_DAILY_LIMIT 默认值(3)与 getTodayUtcKey 保持一致,
 * 跨 UTC 天自动重置。跨设备/清缓存会与后端短暂不一致,可接受(MVP)。
 */

const CREATIVE_QUOTA_LIMIT = 3;
import { useEffect, useState } from "react";
import type { CreativePageKey } from "@/lib/creative-quota-core";
import { incrementCreativeUsedCount } from "@/lib/creative-quota-core";

const STORAGE_PREFIX = "creative_quota:";
const LEGACY_STORAGE_PREFIX = "creative_quota_";

function getTodayUtcKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getKey(pageKey: CreativePageKey): string {
  return `${STORAGE_PREFIX}${pageKey}:${getTodayUtcKey()}`;
}

export function getCreativeLimit(): number {
  return CREATIVE_QUOTA_LIMIT;
}

export function getCreativeUsed(pageKey: CreativePageKey = "story-generator"): number {
  if (typeof window === "undefined") return 0;
  try {
    const key = getKey(pageKey);
    let v = window.localStorage.getItem(key);
    if (!v && pageKey === "story-generator") {
      v = window.localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${getTodayUtcKey()}`);
      if (v) window.localStorage.setItem(key, v);
    }
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

export function markCreativeUsed(n: number, pageKey: CreativePageKey = "story-generator"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getKey(pageKey), String(Math.max(0, n)));
  } catch {
    // ignore
  }
}

/** creative 生成成功后 +1,返回新的已用次数 */
export function markCreativeIncrement(pageKey: CreativePageKey = "story-generator"): number {
  const next = incrementCreativeUsedCount(getCreativeUsed(pageKey), CREATIVE_QUOTA_LIMIT);
  markCreativeUsed(next, pageKey);
  return next;
}

/** 后端返回 429 时,同步本地为已用完 */
export function markCreativeQuotaExhausted(pageKey: CreativePageKey = "story-generator"): void {
  markCreativeUsed(CREATIVE_QUOTA_LIMIT, pageKey);
}

export function isCreativeExhausted(pageKey: CreativePageKey = "story-generator"): boolean {
  return getCreativeUsed(pageKey) >= CREATIVE_QUOTA_LIMIT;
}

export function useCreativeQuota(pageKey: CreativePageKey) {
  const [used, setUsed] = useState(0);

  useEffect(() => {
    setUsed(getCreativeUsed(pageKey));
  }, [pageKey]);

  return {
    used,
    setUsed,
    increment: () => {
      const next = markCreativeIncrement(pageKey);
      setUsed(next);
      return next;
    },
    exhaust: () => {
      markCreativeQuotaExhausted(pageKey);
      setUsed(CREATIVE_QUOTA_LIMIT);
    },
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
