/**
 * creative 每日免费额度的客户端 localStorage 镜像。
 *
 * 后端 KV 是真实计数源,前端 localStorage 仅用于 UI 即时反馈(不等网络)。
 * 跟后端 FREE_CREATIVE_DAILY_LIMIT 默认值(3)与 getTodayUtcKey 保持一致,
 * 跨 UTC 天自动重置。跨设备/清缓存会与后端短暂不一致,可接受(MVP)。
 */

const CREATIVE_QUOTA_LIMIT = 3;
const STORAGE_PREFIX = "creative_quota_";

function getTodayUtcKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getKey(): string {
  return `${STORAGE_PREFIX}${getTodayUtcKey()}`;
}

export function getCreativeLimit(): number {
  return CREATIVE_QUOTA_LIMIT;
}

export function getCreativeUsed(): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = window.localStorage.getItem(getKey());
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

export function markCreativeUsed(n: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getKey(), String(Math.max(0, n)));
  } catch {
    // ignore
  }
}

/** creative 生成成功后 +1,返回新的已用次数 */
export function markCreativeIncrement(): number {
  const next = getCreativeUsed() + 1;
  markCreativeUsed(next);
  return next;
}

/** 后端返回 429 时,同步本地为已用完 */
export function markCreativeQuotaExhausted(): void {
  markCreativeUsed(CREATIVE_QUOTA_LIMIT);
}

export function isCreativeExhausted(): boolean {
  return getCreativeUsed() >= CREATIVE_QUOTA_LIMIT;
}
