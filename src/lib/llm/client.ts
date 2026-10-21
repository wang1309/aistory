import { logger } from "@/lib/logger";
import { getAiProvider, getChatProviderConfig } from "./config";
import { publicErrorMessage } from "./errors";
import {
  inferModelTier,
  isReasoningModel,
  resolveFastMinMaxTokens,
  resolveModelTier,
  resolveReasoningEffort,
} from "./models";
import {
  collapseSseText,
  createSseFromCompletion,
  extractLogicalError,
  normalizeSseStream,
  unwrapChatPayload,
} from "./normalize";
import type {
  AiProvider,
  ChatProviderConfig,
  ChatRequestBody,
} from "./types";

export class LLMConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMConfigError";
  }
}

export type FetchChatCompletionOptions = {
  body: ChatRequestBody;
  provider?: AiProvider;
  signal?: AbortSignal;
};

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Content-Type-Options": "nosniff",
};

function createTimeoutSignal(ms: number): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined") {
    return undefined;
  }
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Normalize a route-built request for the active provider: resolve tier
 * aliases, always set an explicit `stream` flag (APIMart defaults differ
 * between its docs), and drop parameters the provider does not support.
 */
export function prepareChatRequestBody(
  body: ChatRequestBody,
  config: ChatProviderConfig = getChatProviderConfig()
): ChatRequestBody {
  const model = resolveModelTier(body.model, config.provider);
  const next: ChatRequestBody = {
    ...body,
    model,
    stream: body.stream === true,
  };

  if (!config.supportsResponseFormat) {
    delete next.response_format;
  }

  // GPT-5 reasoning models can spend the entire `max_tokens` budget on hidden
  // reasoning and return an empty message. Apply a tier-aware effort policy:
  // fast keeps "low" thinking, standard/creative stay on the model default.
  const tier = inferModelTier(model, config.provider);

  if (config.provider === "apimart" && isReasoningModel(model, config.provider)) {
    if (next.reasoning_effort === undefined) {
      const effort = resolveReasoningEffort(tier, config.provider);
      if (effort) {
        next.reasoning_effort = effort;
      }
    }

    if (tier === "fast") {
      const floor = resolveFastMinMaxTokens();
      if (
        floor > 0 &&
        typeof next.max_tokens === "number" &&
        next.max_tokens < floor
      ) {
        next.max_tokens = floor;
      }
    }
  }

  return next;
}

function buildJsonResponse(
  rawText: string,
  status: number,
  provider: string
): Response {
  let json: unknown = null;

  try {
    json = JSON.parse(rawText);
  } catch {
    // Some gateways mislabel SSE responses as application/json.
    if (rawText.includes("data:")) {
      const collapsed = collapseSseText(rawText);
      const collapsedContent = collapsed.choices[0]?.message?.content;

      if (typeof collapsedContent === "string" && collapsedContent.trim()) {
        return Response.json(collapsed, { status });
      }
    }
  }

  const normalized = unwrapChatPayload(json);

  if (!normalized) {
    logger.error("[llm] upstream returned an invalid JSON payload", {
      provider,
      preview: rawText.slice(0, 200),
    });
    return Response.json(
      { error: { message: "AI service returned an invalid response" } },
      { status: 502 }
    );
  }

  const logicalError = extractLogicalError(json);
  if (logicalError) {
    logger.error("[llm] upstream returned a logical error with HTTP 200", {
      provider,
      status: logicalError.code,
      detail: logicalError.message.slice(0, 500),
    });
    return Response.json(
      {
        error: {
          code: logicalError.code,
          message: publicErrorMessage(logicalError.code),
        },
      },
      { status: logicalError.code }
    );
  }

  // A reasoning model can return HTTP 200 with only a usage block and an empty
  // message when it exhausts its output budget on hidden reasoning.
  const choices = Array.isArray(normalized.choices) ? normalized.choices : [];
  const firstChoice = choices[0];
  const message =
    isRecord(firstChoice) && isRecord(firstChoice.message)
      ? firstChoice.message
      : null;

  if (message) {
    const content = message.content;
    const hasContent =
      (typeof content === "string" && content.trim().length > 0) ||
      (Array.isArray(content) && content.length > 0) ||
      (Array.isArray(message.tool_calls) && message.tool_calls.length > 0);

    if (!hasContent) {
      logger.error("[llm] non-stream response had no visible content", {
        provider,
        finishReason: isRecord(firstChoice)
          ? firstChoice.finish_reason
          : undefined,
        usage: normalized.usage,
      });
      return Response.json(
        { error: { message: "AI service returned an empty response" } },
        { status: 502 }
      );
    }
  }

  return Response.json(normalized, { status });
}

/**
 * Drop-in replacement for `fetch(`${baseUrl}/v1/chat/completions`, ...)`.
 *
 * - Resolves provider credentials from AI_PROVIDER (grsai | apimart)
 * - Unwraps APIMart's `{ code, data }` envelope for non-stream responses
 * - Rewrites APIMart SSE chunks into the OpenAI shape the app expects
 * - Preserves the streaming `usage` chunk used for credit billing
 * - Can serve non-stream routes by aggregating an upstream SSE stream
 *   (APIMart's non-stream queue is much slower than its stream path)
 * - Sanitizes upstream errors before they reach user-facing messages
 */
export async function fetchChatCompletion({
  body,
  provider = getAiProvider(),
  signal,
}: FetchChatCompletionOptions): Promise<Response> {
  const config = getChatProviderConfig(provider);

  if (!config.apiKey) {
    throw new LLMConfigError(
      `AI API key not configured for provider: ${config.provider}`
    );
  }

  const payload = prepareChatRequestBody(body, config);
  const clientWantsStream = payload.stream === true;
  const upstreamStream = clientWantsStream || config.streamNonStreamRequests;
  const upstreamPayload = upstreamStream
    ? { ...payload, stream: true }
    : payload;
  const path = upstreamStream ? config.chatPath : config.chatPathNoStream;
  const url = `${config.baseUrl}${path}`;

  let upstream: Response;

  if (clientWantsStream) {
    // Only guard the connection setup. A full-body timeout would abort long
    // story streams after the first byte.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      upstream = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(upstreamPayload),
        signal: signal ?? controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } else {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(upstreamPayload),
      signal: signal ?? createTimeoutSignal(config.timeoutMs),
    });
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    logger.error("[llm] upstream request failed", {
      provider: config.provider,
      status: upstream.status,
      detail: detail.slice(0, 800),
    });

    return Response.json(
      {
        error: {
          code: upstream.status,
          message: publicErrorMessage(upstream.status),
        },
      },
      { status: upstream.status }
    );
  }

  const contentType = upstream.headers.get("content-type") || "";

  if (clientWantsStream) {
    if (contentType.includes("application/json")) {
      const json = await upstream.json().catch(() => null);
      const stream = createSseFromCompletion(json);

      if (stream) {
        return new Response(stream, { status: 200, headers: SSE_HEADERS });
      }

      logger.error("[llm] stream request returned a non-stream payload", {
        provider: config.provider,
      });
      return Response.json(
        { error: { message: "AI service returned an invalid response" } },
        { status: 502 }
      );
    }

    if (!upstream.body) {
      throw new Error("AI service returned an empty stream");
    }

    return new Response(normalizeSseStream(upstream.body), {
      status: upstream.status,
      headers: SSE_HEADERS,
    });
  }

  // Non-stream route. When streamNonStreamRequests is enabled we requested SSE
  // and aggregate it into a normal chat.completion object.
  if (upstreamStream) {
    if (contentType.includes("application/json")) {
      const rawText = await upstream.text();
      return buildJsonResponse(rawText, upstream.status, config.provider);
    }

    const text = await upstream.text();
    const completion = collapseSseText(text);
    const message = completion.choices[0]?.message as
      | { content?: string; tool_calls?: unknown[] }
      | undefined;
    const hasContent = Boolean(
      message?.content?.trim() ||
        (Array.isArray(message?.tool_calls) && message.tool_calls.length > 0)
    );

    if (!hasContent) {
      logger.error("[llm] aggregated stream had no visible content", {
        provider: config.provider,
        finishReason: completion.choices[0]?.finish_reason,
        usage: completion.usage,
      });
      return Response.json(
        { error: { message: "AI service returned an empty response" } },
        { status: 502 }
      );
    }

    return Response.json(completion, { status: upstream.status });
  }

  const rawText = await upstream.text();
  return buildJsonResponse(rawText, upstream.status, config.provider);
}
