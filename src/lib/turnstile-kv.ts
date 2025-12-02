import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getUserUuid } from "@/services/user";
import { headers } from "next/headers";

const TURNSTILE_KV_TTL_SECONDS = 30 * 60; // 30 minutes

function getTurnstileKv() {
  try {
    const { env }: { env?: any } = getCloudflareContext();
    if (!env) {
      console.log("Turnstile KV: env is not available from Cloudflare context");
      return null;
    }

    const kv = (env as any).TURNSTILE_KV;
    if (!kv) {
      console.log("Turnstile KV: TURNSTILE_KV binding not found in env");
      return null;
    }

    return kv as any;
  } catch (e) {
    console.log("Turnstile KV: failed to get Cloudflare context", e);
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
  const namespaceId = process.env.CF_TURNSTILE_KV_NAMESPACE_ID;
  const apiToken = process.env.CF_KV_API_TOKEN;

  if (!accountId || !namespaceId || !apiToken) {
    return null;
  }

  return { accountId, namespaceId, apiToken };
}

async function getTurnstileIdentity(): Promise<string | null> {
  try {
    const userUuid = await getUserUuid();
    if (userUuid) {
      return `user:${userUuid}`;
    }
  } catch (e) {
    console.log("Turnstile KV: getUserUuid failed when resolving identity", e);
  }

  try {
    const h = await headers();
    const ip =
      h.get("cf-connecting-ip") ||
      (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
      h.get("x-real-ip");
    if (ip) {
      return `ip:${ip}`;
    }
  } catch (e) {
    console.log("Turnstile KV: resolve IP for identity failed", e);
  }

  if (process.env.NODE_ENV === "development") {
    console.log("Turnstile KV: using dev-local identity fallback");
    return "dev:local";
  }

  console.log("Turnstile KV: failed to resolve identity");
  return null;
}

function getIdentityKey(identity: string) {
  return `turnstile:identity:${identity}`;
}

/**
 * 检查当前用户/IP 是否在 KV 中被标记为最近已通过 Turnstile 验证
 * - 命中则返回 true，并跳过本次 Cloudflare 校验
 * - 未命中或出错时返回 false
 */
export async function isIdentityVerifiedInKv(): Promise<boolean> {
  const identity = await getTurnstileIdentity();
  if (!identity) {
    console.log("Turnstile KV: identity is empty, skip cache");
    return false;
  }

  const kv = getTurnstileKv();
  const key = getIdentityKey(identity);
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && kv) {
    try {
      const value = await (kv as any).get(key, "text");
      if (value) {
        console.log("Turnstile KV: cache hit for", identity);
        return true;
      }
      return false;
    } catch (e) {
      console.log("Turnstile KV: read error", e);
    }
  }

  const restConfig = getKvRestConfigFromEnv();
  if (!restConfig) {
    console.log("Turnstile KV: REST config missing, skip cache");
    return false;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${restConfig.accountId}/storage/kv/namespaces/${restConfig.namespaceId}/values/${encodeURIComponent(
      key,
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${restConfig.apiToken}`,
      },
    });

    if (response.ok) {
      console.log("Turnstile KV: REST cache hit for", identity);
      return true;
    }

    if (response.status === 404) {
      return false;
    }

    console.log("Turnstile KV: REST read non-OK status", response.status);
  } catch (e) {
    console.log("Turnstile KV: REST read error", e);
  }

  return false;
}

/**
 * 将当前用户/IP 标记为 Turnstile 已验证，通过 KV 记录，默认 30 分钟过期
 */
export async function markIdentityVerifiedInKv(): Promise<void> {
  const identity = await getTurnstileIdentity();
  if (!identity) {
    console.log("Turnstile KV: identity is empty, skip mark");
    return;
  }

  const kv = getTurnstileKv();
  const key = getIdentityKey(identity);
  const payload = JSON.stringify({
    identity,
    verifiedAt: Date.now(),
  });
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && kv) {
    try {
      await (kv as any).put(key, payload, { expirationTtl: TURNSTILE_KV_TTL_SECONDS });
      console.log("Turnstile KV: marked verified for", identity);
      return;
    } catch (e) {
      console.log("Turnstile KV: write error", e);
    }
  }

  const restConfig = getKvRestConfigFromEnv();
  if (!restConfig) {
    return;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${restConfig.accountId}/storage/kv/namespaces/${restConfig.namespaceId}/values/${encodeURIComponent(
      key,
    )}?expiration_ttl=${TURNSTILE_KV_TTL_SECONDS}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${restConfig.apiToken}`,
        "Content-Type": "text/plain",
      },
      body: payload,
    });

    if (!response.ok) {
      console.log("Turnstile KV: REST write non-OK status", response.status);
    } else {
      console.log("Turnstile KV: REST marked verified for", identity);
    }
  } catch (e) {
    console.log("Turnstile KV: REST write error", e);
  }
}
