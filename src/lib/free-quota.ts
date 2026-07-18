import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { getTurnstileIdentity } from "@/lib/turnstile-kv";
import {
  buildCreativeMergeKey,
  buildCreativeMigrationKey,
  buildCreativeQuotaKey,
  buildLegacyCreativeQuotaKey,
  CREATIVE_PAGE_KEYS,
  getCreativeQuotaStatus,
  mergeUsedCounts,
  migrateCreativeUsedCount,
  type CreativePageKey,
  type CreativeQuotaStatus,
} from "@/lib/creative-quota-core";

/**
 * 每日免费额度计数(Cloudflare KV)
 *
 * - creative 模型每天 N 次(默认 3),按 identity 计数(user:uuid 优先,回退 ip:ip)
 * - IP 级 hard cap:防匿名脚本刷量(默认 50/天),仅按 IP
 * - fail-open:KV 不可用时不阻断主流程,仅打日志
 * - key 按 UTC 日期滚动,TTL 30h(覆盖一天 + 缓冲)
 *
 * 复用 turnstile-kv 的 KV 双通道模式(binding + REST)与 identity 解析,
 * 但使用独立的 FREE_QUOTA_KV namespace(见 wrangler.toml / CF_FREE_QUOTA_KV_NAMESPACE_ID)。
 */

const FREE_QUOTA_KV_TTL_SECONDS = 30 * 60 * 60; // 30h
const CREATIVE_VISITOR_COOKIE = "creative_visitor_id";
const CREATIVE_VISITOR_MAX_AGE = 60 * 60 * 24 * 90;

export { CREATIVE_PAGE_KEYS };
export type { CreativePageKey, CreativeQuotaStatus };

// ========== 配置(env 可调,支持一键关闭/收紧) ==========

function getCreativeDailyLimit(): number {
  const v = Number(process.env.FREE_CREATIVE_DAILY_LIMIT);
  return Number.isFinite(v) && v > 0 ? v : 3;
}

function getIpDailyHardCap(): number {
  const v = Number(process.env.FREE_IP_DAILY_HARD_CAP);
  return Number.isFinite(v) && v > 0 ? v : 50;
}

// ========== KV 双通道(照抄 turnstile-kv 模式) ==========

function getFreeQuotaKv() {
  try {
    const { env }: { env?: any } = getCloudflareContext();
    if (!env) {
      console.log("FreeQuota KV: env not available");
      return null;
    }
    const kv = (env as any).FREE_QUOTA_KV;
    if (!kv) {
      console.log("FreeQuota KV: FREE_QUOTA_KV binding not found");
      return null;
    }
    return kv as any;
  } catch (e) {
    console.log("FreeQuota KV: failed to get Cloudflare context", e);
    return null;
  }
}

type KvRestConfig = {
  accountId: string;
  namespaceId: string;
  apiToken: string;
};

function getKvRestConfigFromEnv(): KvRestConfig | null {
  const accountId = process.env.CF_ACCOUNT_ID;
  const namespaceId = process.env.CF_FREE_QUOTA_KV_NAMESPACE_ID;
  const apiToken = process.env.CF_KV_API_TOKEN;
  if (!accountId || !namespaceId || !apiToken) {
    return null;
  }
  return { accountId, namespaceId, apiToken };
}

async function kvGet(key: string): Promise<string | null> {
  const kv = getFreeQuotaKv();
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && kv) {
    try {
      const value = await (kv as any).get(key, "text");
      return value ?? null;
    } catch (e) {
      console.log("FreeQuota KV: read error", e);
    }
  }

  // REST fallback(dev 环境也走这里)
  const rest = getKvRestConfigFromEnv();
  if (!rest) {
    return null;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${rest.accountId}/storage/kv/namespaces/${rest.namespaceId}/values/${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${rest.apiToken}` },
    });
    if (response.ok) return await response.text();
    if (response.status === 404) return null;
    console.log("FreeQuota KV: REST read non-OK", response.status);
  } catch (e) {
    console.log("FreeQuota KV: REST read error", e);
  }
  return null;
}

async function kvPut(key: string, value: string, ttl: number): Promise<void> {
  const kv = getFreeQuotaKv();
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && kv) {
    try {
      await (kv as any).put(key, value, { expirationTtl: ttl });
      return;
    } catch (e) {
      console.log("FreeQuota KV: write error", e);
    }
  }

  const rest = getKvRestConfigFromEnv();
  if (!rest) return;

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${rest.accountId}/storage/kv/namespaces/${rest.namespaceId}/values/${encodeURIComponent(key)}?expiration_ttl=${ttl}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${rest.apiToken}`,
        "Content-Type": "text/plain",
      },
      body: value,
    });
    if (!response.ok) {
      console.log("FreeQuota KV: REST write non-OK", response.status);
    }
  } catch (e) {
    console.log("FreeQuota KV: REST write error", e);
  }
}

// ========== 日期 key(UTC,每 24h 滚动) ==========

function getTodayUtcKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getCreativeDateKey(): string {
  return getTodayUtcKey();
}

function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  const entry = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!entry) return null;
  try {
    const value = decodeURIComponent(entry.slice(prefix.length));
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

export type CreativeVisitorContext = {
  visitorId: string;
  visitorIdentity: string;
  setCookie?: string;
};

export function getCreativeVisitorContext(cookieHeader: string | null): CreativeVisitorContext {
  const existing = parseCookieHeader(cookieHeader, CREATIVE_VISITOR_COOKIE);
  if (existing) {
    return { visitorId: existing, visitorIdentity: `visitor:${existing}` };
  }

  const visitorId = crypto.randomUUID();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    visitorId,
    visitorIdentity: `visitor:${visitorId}`,
    setCookie: `${CREATIVE_VISITOR_COOKIE}=${encodeURIComponent(visitorId)}; Max-Age=${CREATIVE_VISITOR_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  };
}

export function appendCreativeVisitorCookie(response: Response, setCookie?: string): Response {
  if (setCookie) response.headers.append("Set-Cookie", setCookie);
  return response;
}

export function getCreativeQuotaKey(
  dateKey: string,
  identity: string,
  pageKey: CreativePageKey
) {
  return buildCreativeQuotaKey(dateKey, identity, pageKey);
}

export function getCreativeMergeKey(
  dateKey: string,
  visitorIdentity: string,
  userIdentity: string,
  pageKey: CreativePageKey
) {
  return buildCreativeMergeKey(dateKey, visitorIdentity, userIdentity, pageKey);
}

/** Copy the pre-page-scoped story counter into the new story key once. */
export async function migrateLegacyStoryCreativeQuota(identity: string): Promise<void> {
  const dateKey = getTodayUtcKey();
  const markerKey = buildCreativeMigrationKey(dateKey, identity);
  if (await kvGet(markerKey)) return;

  const legacyRaw = await kvGet(buildLegacyCreativeQuotaKey(dateKey, identity));
  if (legacyRaw !== null) {
    const limit = getCreativeDailyLimit();
    const current = await readCreativeQuota("story-generator", identity);
    await writeCreativeQuota(
      "story-generator",
      identity,
      migrateCreativeUsedCount(Number(legacyRaw) || 0, current.used, limit)
    );
  }

  await kvPut(markerKey, "1", FREE_QUOTA_KV_TTL_SECONDS);
}

export async function readCreativeQuota(
  pageKey: CreativePageKey,
  identity: string
): Promise<CreativeQuotaStatus> {
  const limit = getCreativeDailyLimit();
  const raw = await kvGet(getCreativeQuotaKey(getTodayUtcKey(), identity, pageKey));
  return getCreativeQuotaStatus(raw ? Number(raw) || 0 : 0, limit);
}

export async function writeCreativeQuota(
  pageKey: CreativePageKey,
  identity: string,
  used: number
): Promise<void> {
  await kvPut(
    getCreativeQuotaKey(getTodayUtcKey(), identity, pageKey),
    String(Math.max(0, used)),
    FREE_QUOTA_KV_TTL_SECONDS
  );
}

export async function incrementPageCreativeQuota(
  pageKey: CreativePageKey,
  identity: string
): Promise<CreativeQuotaStatus> {
  const current = await readCreativeQuota(pageKey, identity);
  const used = current.used + 1;
  await writeCreativeQuota(pageKey, identity, used);
  return getCreativeQuotaStatus(used, current.limit);
}

export async function mergePageCreativeQuota(
  pageKey: CreativePageKey,
  visitorIdentity: string,
  userIdentity: string
): Promise<void> {
  const dateKey = getTodayUtcKey();
  const mergeKey = getCreativeMergeKey(dateKey, visitorIdentity, userIdentity, pageKey);
  if (await kvGet(mergeKey)) return;

  const visitor = await readCreativeQuota(pageKey, visitorIdentity);
  const account = await readCreativeQuota(pageKey, userIdentity);
  const merged = mergeUsedCounts(account.used, visitor.used, account.limit);
  await writeCreativeQuota(pageKey, userIdentity, merged);
  await kvPut(mergeKey, "1", FREE_QUOTA_KV_TTL_SECONDS);
}

// ========== IP identity(用于 hard cap,独立于 turnstile identity) ==========

async function getIpIdentity(): Promise<string | null> {
  try {
    const h = await headers();
    const ip =
      h.get("cf-connecting-ip") ||
      (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
      h.get("x-real-ip");
    if (ip) return `ip:${ip}`;
  } catch (e) {
    console.log("FreeQuota KV: resolve IP failed", e);
  }
  if (process.env.NODE_ENV === "development") {
    return "dev:local";
  }
  return null;
}

// ========== 业务 API ==========

export type QuotaStatus = {
  used: number;
  limit: number;
  remaining: number;
};

/**
 * 检查 creative 每日免费额度。
 * 按 identity 计数(已登录 user:uuid,匿名 ip:ip)。
 * fail-open:identity 解析失败或 KV 不可用时返回 used=0(放行)。
 */
export async function checkCreativeQuota(): Promise<QuotaStatus> {
  const limit = getCreativeDailyLimit();
  const identity = await getTurnstileIdentity();
  if (!identity) {
    return { used: 0, limit, remaining: limit };
  }
  const key = `free-quota:${getTodayUtcKey()}:${identity}:creative`;
  const raw = await kvGet(key);
  const used = raw ? Number(raw) || 0 : 0;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * creative 免费额度 +1。流式开始前乐观调用。
 * 失败(fail-open)不抛错,仅打日志。
 */
export async function incrementCreativeQuota(): Promise<void> {
  try {
    const identity = await getTurnstileIdentity();
    if (!identity) return;
    const key = `free-quota:${getTodayUtcKey()}:${identity}:creative`;
    const raw = await kvGet(key);
    const used = raw ? Number(raw) || 0 : 0;
    await kvPut(key, String(used + 1), FREE_QUOTA_KV_TTL_SECONDS);
  } catch (e) {
    console.log("FreeQuota KV: increment creative failed", e);
  }
}

/**
 * 检查 IP 级 hard cap(防匿名脚本刷量)。仅按 IP 计数。
 * fail-open。
 */
export async function checkIpHardCap(): Promise<QuotaStatus> {
  const limit = getIpDailyHardCap();
  const identity = await getIpIdentity();
  if (!identity) {
    return { used: 0, limit, remaining: limit };
  }
  const key = `free-quota:${getTodayUtcKey()}:${identity}:ipcap`;
  const raw = await kvGet(key);
  const used = raw ? Number(raw) || 0 : 0;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * IP hard cap +1。
 */
export async function incrementIpHardCap(): Promise<void> {
  try {
    const identity = await getIpIdentity();
    if (!identity) return;
    const key = `free-quota:${getTodayUtcKey()}:${identity}:ipcap`;
    const raw = await kvGet(key);
    const used = raw ? Number(raw) || 0 : 0;
    await kvPut(key, String(used + 1), FREE_QUOTA_KV_TTL_SECONDS);
  } catch (e) {
    console.log("FreeQuota KV: increment ipcap failed", e);
  }
}
