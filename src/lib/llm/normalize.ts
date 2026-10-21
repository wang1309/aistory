import type { ChatUsage } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * APIMart wraps successful payloads as `{ code, data }` while GRSAI (and plain
 * OpenAI) return the completion object at the top level. Normalize both.
 */
export function unwrapChatPayload(
  payload: unknown
): Record<string, unknown> | null {
  if (!isRecord(payload)) {
    return null;
  }

  const data = payload.data;
  if (
    isRecord(data) &&
    (Array.isArray(data.choices) ||
      isRecord(data.usage) ||
      typeof data.id === "string")
  ) {
    return data;
  }

  return payload;
}

export function extractUsage(payload: unknown): ChatUsage | null {
  const body = unwrapChatPayload(payload);
  if (!body || !isRecord(body.usage)) {
    return null;
  }

  const usage = body.usage;
  const promptTokens = toNumber(usage.prompt_tokens ?? usage.input_tokens);
  const completionTokens = toNumber(
    usage.completion_tokens ?? usage.output_tokens
  );
  const totalTokens = toNumber(usage.total_tokens);

  if (
    promptTokens === undefined &&
    completionTokens === undefined &&
    totalTokens === undefined
  ) {
    return null;
  }

  return {
    ...(promptTokens !== undefined ? { prompt_tokens: promptTokens } : {}),
    ...(completionTokens !== undefined
      ? { completion_tokens: completionTokens }
      : {}),
    ...(totalTokens !== undefined ? { total_tokens: totalTokens } : {}),
  };
}

export function extractCompletionText(payload: unknown): string {
  const body = unwrapChatPayload(payload);
  const choice = Array.isArray(body?.choices) ? body?.choices[0] : undefined;
  if (!isRecord(choice)) {
    return "";
  }

  if (isRecord(choice.message) && typeof choice.message.content === "string") {
    return choice.message.content;
  }

  return typeof choice.text === "string" ? choice.text : "";
}

export function extractDeltaText(payload: unknown): string {
  const body = unwrapChatPayload(payload);
  const choice = Array.isArray(body?.choices) ? body?.choices[0] : undefined;
  if (!isRecord(choice) || !isRecord(choice.delta)) {
    return "";
  }

  return typeof choice.delta.content === "string" ? choice.delta.content : "";
}

/**
 * Some gateways return HTTP 200 with a logical error in the body, e.g.
 * `{ code: 402, message: "account balance exhausted" }`. Detect that shape
 * before routes try to read `choices`.
 */
export function extractLogicalError(
  payload: unknown
): { code: number; message: string } | null {
  if (!isRecord(payload)) {
    return null;
  }

  const rawCode = payload.code;
  const code =
    typeof rawCode === "number"
      ? rawCode
      : typeof rawCode === "string"
        ? Number.parseInt(rawCode, 10)
        : Number.NaN;

  if (!Number.isFinite(code) || code < 400) {
    return null;
  }

  if (Array.isArray(payload.choices)) {
    return null;
  }

  if (
    isRecord(payload.data) &&
    (Array.isArray(payload.data.choices) || isRecord(payload.data.usage))
  ) {
    return null;
  }

  return {
    code,
    message: typeof payload.message === "string" ? payload.message : "",
  };
}

function normalizeSseDataLine(line: string): string | null {
  const trimmed = line.replace(/\r$/, "").trim();
  if (!trimmed || trimmed.startsWith(":")) {
    return null;
  }

  if (
    trimmed.startsWith("event:") ||
    trimmed.startsWith("id:") ||
    trimmed.startsWith("retry:")
  ) {
    return null;
  }

  let raw = "";
  if (trimmed.startsWith("data:")) {
    raw = trimmed.slice(5).trimStart();
  } else if (trimmed.startsWith("{")) {
    raw = trimmed;
  } else {
    return null;
  }

  if (!raw) {
    return null;
  }

  if (raw === "[DONE]") {
    return "data: [DONE]\n\n";
  }

  try {
    const normalized = unwrapChatPayload(JSON.parse(raw));
    return normalized ? `data: ${JSON.stringify(normalized)}\n\n` : null;
  } catch {
    return null;
  }
}

/**
 * Rewrite an upstream SSE stream into the exact shape the app already expects:
 * one `data: <json>` line per event, followed by a blank line, ending with
 * `data: [DONE]`.
 */
export function normalizeSseStream(
  stream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          const normalized = normalizeSseDataLine(line);
          if (normalized) {
            controller.enqueue(encoder.encode(normalized));
          }

          newlineIndex = buffer.indexOf("\n");
        }
      },
      flush(controller) {
        buffer += decoder.decode();

        for (const line of buffer.split("\n")) {
          const normalized = normalizeSseDataLine(line);
          if (normalized) {
            controller.enqueue(encoder.encode(normalized));
          }
        }
      },
    })
  );
}

/**
 * Fallback for providers that ignore `stream: true` and return a regular JSON
 * completion. Converts it into a single SSE event so streaming routes and
 * clients keep working.
 */
export function createSseFromCompletion(
  payload: unknown
): ReadableStream<Uint8Array> | null {
  const body = unwrapChatPayload(payload);
  if (!body) {
    return null;
  }

  const text = extractCompletionText(body);
  const usage = extractUsage(body);
  const model = typeof body.model === "string" ? body.model : undefined;
  const id = typeof body.id === "string" ? body.id : "chatcmpl-fallback";

  if (!text && !usage) {
    return null;
  }

  const events: string[] = [];

  if (text) {
    events.push(
      `data: ${JSON.stringify({
        id,
        object: "chat.completion.chunk",
        ...(model ? { model } : {}),
        choices: [
          { index: 0, delta: { role: "assistant", content: text }, finish_reason: null },
        ],
      })}\n\n`
    );
  }

  events.push(
    `data: ${JSON.stringify({
      id,
      object: "chat.completion.chunk",
      ...(model ? { model } : {}),
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      ...(usage ? { usage } : {}),
    })}\n\n`
  );

  events.push("data: [DONE]\n\n");

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });
}

/**
 * Rare case: a non-stream request receives an SSE response. Collapse the
 * deltas into a normal chat.completion JSON object.
 */
export function collapseSseText(text: string) {
  let content = "";
  let usage: ChatUsage | null = null;
  let model: string | undefined;
  let id = "chatcmpl-collapsed";

  for (const line of text.split("\n")) {
    const trimmed = line.replace(/\r$/, "").trim();
    if (!trimmed.startsWith("data:")) {
      continue;
    }

    const raw = trimmed.slice(5).trimStart();
    if (!raw || raw === "[DONE]") {
      continue;
    }

    try {
      const body = unwrapChatPayload(JSON.parse(raw));
      if (!body) {
        continue;
      }

      content += extractDeltaText(body);

      if (typeof body.model === "string") {
        model = body.model;
      }
      if (typeof body.id === "string") {
        id = body.id;
      }

      const chunkUsage = extractUsage(body);
      if (chunkUsage) {
        usage = chunkUsage;
      }
    } catch {
      // ignore malformed keepalive lines
    }
  }

  return {
    id,
    object: "chat.completion",
    ...(model ? { model } : {}),
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
    ...(usage ? { usage } : {}),
  };
}
