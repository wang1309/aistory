import type { AiProvider, ChatProviderConfig } from "./types";

const DEFAULT_GRSAI_BASE_URL = "https://api.grsai.com";
const DEFAULT_APIMART_BASE_URL = "https://api.apimart.ai";
const DEFAULT_TIMEOUT_MS = 180_000;

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Active text provider. Defaults to GRSAI so existing deployments keep
 * working until `AI_PROVIDER=apimart` is rolled out.
 */
export function getAiProvider(
  env: NodeJS.ProcessEnv = process.env
): AiProvider {
  return (env.AI_PROVIDER || "").trim().toLowerCase() === "apimart"
    ? "apimart"
    : "grsai";
}

export function getChatProviderConfig(
  provider: AiProvider = getAiProvider()
): ChatProviderConfig {
  const timeoutMs = readPositiveInt(process.env.AI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

  if (provider === "apimart") {
    const chatPath = process.env.APIMART_CHAT_PATH || "/v1/chat/completions";

    return {
      provider,
      apiKey: (process.env.APIMART_API_KEY || "").trim(),
      baseUrl: stripTrailingSlash(
        process.env.APIMART_BASE_URL || DEFAULT_APIMART_BASE_URL
      ),
      // APIMart exposes both /v1 and /api/v1; keep the GRSAI-compatible path by
      // default and allow an override after the compatibility probe.
      chatPath,
      // Official non-stream path from the APIMart docs. The streaming path
      // also works here, but the docs use /api/v1 for `stream: false`.
      chatPathNoStream:
        process.env.APIMART_CHAT_PATH_NOSTREAM || "/api/v1/chat/completions",
      // Not documented for APIMart yet. Enable after the probe confirms support.
      supportsResponseFormat:
        process.env.APIMART_SUPPORTS_RESPONSE_FORMAT === "true",
      // Official behavior is `stream: false` for non-stream routes. The SSE
      // aggregation workaround is opt-in because the gateway's non-stream queue
      // can be much slower than its stream path.
      streamNonStreamRequests:
        process.env.AI_NONSTREAM_VIA_STREAM === "true",
      timeoutMs,
    };
  }

  return {
    provider: "grsai",
    apiKey: (process.env.GRSAI_API_KEY || "").trim(),
    baseUrl: stripTrailingSlash(
      process.env.GRSAI_BASE_URL || DEFAULT_GRSAI_BASE_URL
    ),
    chatPath: "/v1/chat/completions",
    chatPathNoStream: "/v1/chat/completions",
    supportsResponseFormat: true,
    streamNonStreamRequests: false,
    timeoutMs,
  };
}

export function isChatConfigured(provider: AiProvider = getAiProvider()) {
  return Boolean(getChatProviderConfig(provider).apiKey);
}
