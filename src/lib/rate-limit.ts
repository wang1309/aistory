import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { getUserUuid } from "@/services/user";

/**
 * Lightweight rate limiter with three fallback tiers:
 *   1. Cloudflare KV binding (TURNSTILE_KV) — works in Cloudflare prod
 *   2. Cloudflare KV REST API — works in Node when CF_* env vars are set
 *   3. In-process Map — works in local dev (best-effort, single process)
 *
 * Uses fixed-window counters keyed by identity (logged-in user uuid, else IP).
 * Not atomic under extreme concurrency (read-then-write), which is acceptable
 * for abuse throttling — precision is not required.
 */

interface RestConfig {
  accountId: string;
  namespaceId: string;
  apiToken: string;
}

const memStore = new Map<string, { count: number; exp: number }>();

function getKvBinding(): any | null {
  try {
    const { env }: { env?: any } = getCloudflareContext();
    return env?.TURNSTILE_KV ?? null;
  } catch {
    return null;
  }
}

function getRestConfig(): RestConfig | null {
  const accountId = process.env.CF_ACCOUNT_ID;
  const namespaceId = process.env.CF_TURNSTILE_KV_NAMESPACE_ID;
  const apiToken = process.env.CF_KV_API_TOKEN;
  if (!accountId || !namespaceId || !apiToken) return null;
  return { accountId, namespaceId, apiToken };
}

async function resolveIdentity(): Promise<string | null> {
  try {
    const userUuid = await getUserUuid();
    if (userUuid) return `user:${userUuid}`;
  } catch {
    // ignore, fall through to IP
  }

  try {
    const h = await headers();
    const ip =
      h.get("cf-connecting-ip") ||
      (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
      h.get("x-real-ip");
    if (ip) return `ip:${ip}`;
  } catch {
    // ignore
  }

  return null;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

/**
 * Check and consume one unit against `scope` for the current identity.
 * Returns ok=false if the limit is exceeded within the time window.
 */
export async function rateLimit(
  scope: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const identity = await resolveIdentity();
  // Fail-open only when we genuinely cannot identify the caller.
  if (!identity) return { ok: true, remaining: limit };

  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl:${scope}:${identity}:${bucket}`;
  const ttl = windowSec * 2;

  const kv = getKvBinding();
  if (kv) {
    try {
      const raw = await kv.get(key, "text");
      const count = raw ? parseInt(raw, 10) || 0 : 0;
      if (count >= limit) return { ok: false, remaining: 0 };
      await kv.put(key, String(count + 1), { expirationTtl: ttl });
      return { ok: true, remaining: Math.max(0, limit - count - 1) };
    } catch {
      // fall through to REST / memory
    }
  }

  const rc = getRestConfig();
  if (rc) {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${rc.accountId}/storage/kv/namespaces/${rc.namespaceId}/values/${encodeURIComponent(
        key
      )}`;
      const getRes = await fetch(url, {
        headers: { Authorization: `Bearer ${rc.apiToken}` },
      });
      const count = getRes.ok ? parseInt(await getRes.text(), 10) || 0 : 0;
      if (count >= limit) return { ok: false, remaining: 0 };
      await fetch(`${url}?expiration_ttl=${ttl}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${rc.apiToken}`,
          "Content-Type": "text/plain",
        },
        body: String(count + 1),
      });
      return { ok: true, remaining: Math.max(0, limit - count - 1) };
    } catch {
      // fall through to memory
    }
  }

  // In-process fallback
  const now = Date.now();
  const entry = memStore.get(key);
  if (entry && entry.exp > now) {
    if (entry.count >= limit) return { ok: false, remaining: 0 };
    entry.count += 1;
    return { ok: true, remaining: Math.max(0, limit - entry.count) };
  }

  memStore.set(key, { count: 1, exp: now + windowSec * 1000 });

  // Opportunistic cleanup to bound memory growth.
  if (memStore.size > 5000) {
    for (const [k, v] of memStore) {
      if (v.exp <= now) memStore.delete(k);
    }
  }

  return { ok: true, remaining: limit - 1 };
}
