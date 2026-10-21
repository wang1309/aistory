import { fetchChatCompletion } from "@/lib/llm/client";
import { extractDeltaText, extractUsage } from "@/lib/llm/normalize";
import { logger } from "@/lib/logger";
import { respErr } from "@/lib/resp";
import {
  CreditsTransType,
  decreaseCredits,
  getUserCredits,
} from "@/services/credit";
import { getUserUuid } from "@/services/user";
import {
  buildGrSaiChatRequest,
  type GrSaiChatRequestInput,
} from "../_lib";
import {
  calculateContinueChatCredits,
  estimateCompletionTokens,
  estimateMaxContinueChatCredits,
  estimateMessageTokens,
} from "./_lib";

type ContinueChatRequest = GrSaiChatRequestInput & {
  max_tokens: number;
  storyId?: string;
  metadata?: Record<string, unknown>;
};

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type ContinueChatDependencies = {
  getUserUuid: typeof getUserUuid;
  getUserCredits: typeof getUserCredits;
  decreaseCredits: typeof decreaseCredits;
  fetchCompletion: (payload: GrSaiChatRequestInput) => Promise<Response>;
};

function getDefaultDependencies(): ContinueChatDependencies {
  return {
    getUserUuid,
    getUserCredits,
    decreaseCredits,
    fetchCompletion: async (payload) => fetchChatCompletion({ body: payload }),
  };
}

function parseSseLine(line: string): {
  usage: Usage | null;
  content: string;
} {
  const trimmed = line.replace(/\r$/, "").trim();

  if (!trimmed.startsWith("data:")) {
    return { usage: null, content: "" };
  }

  const data = trimmed.slice(5).trimStart();
  if (!data || data === "[DONE]") {
    return { usage: null, content: "" };
  }

  try {
    const parsed = JSON.parse(data);
    return {
      usage: extractUsage(parsed),
      content: extractDeltaText(parsed),
    };
  } catch {
    return { usage: null, content: "" };
  }
}

export function createContinueChatHandler(
  deps: ContinueChatDependencies = getDefaultDependencies()
) {
  return async function POST(req: Request) {
    try {
      const body = (await req.json()) as ContinueChatRequest;

      if (!Array.isArray(body?.messages) || body.messages.length === 0) {
        return respErr("messages are required");
      }

      if (
        typeof body.max_tokens !== "number" ||
        !Number.isFinite(body.max_tokens) ||
        body.max_tokens < 1 ||
        body.max_tokens > 4000
      ) {
        return respErr("invalid max_tokens");
      }

      const inputTokens = estimateMessageTokens(body.messages);
      if (inputTokens > 250_000) {
        return respErr("context too large; trim and retry");
      }

      const user_uuid = await deps.getUserUuid();
      if (!user_uuid) {
        return respErr("no auth");
      }

      const estimatedMaxCredits = estimateMaxContinueChatCredits({
        messages: body.messages,
        maxTokens: body.max_tokens,
      });

      const userCredits = await deps.getUserCredits(user_uuid);
      if ((userCredits.left_credits || 0) < estimatedMaxCredits) {
        return respErr("insufficient credits");
      }

      const upstreamPayload = buildGrSaiChatRequest({
        ...body,
        stream: true,
      });

      const upstream = await deps.fetchCompletion(upstreamPayload);
      if (!upstream.ok) {
        const errorText = await upstream.text();
        return respErr(`AI API error: ${upstream.status} ${errorText}`);
      }

      if (!upstream.body) {
        return respErr("No response body from AI API");
      }

      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      let finalUsage: Usage | null = null;
      let completionText = "";

      const stream = new ReadableStream({
        async start(controller) {
          const reader = upstream.body!.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const parsed = parseSseLine(line);
                if (parsed.usage) {
                  finalUsage = parsed.usage;
                }
                if (parsed.content) {
                  completionText += parsed.content;
                }
              }

              controller.enqueue(encoder.encode(chunk));
            }

            if (buffer) {
              const parsed = parseSseLine(buffer);
              if (parsed.usage) {
                finalUsage = parsed.usage;
              }
              if (parsed.content) {
                completionText += parsed.content;
              }
            }

            let credits: number | null = null;

            if (
              finalUsage?.prompt_tokens !== undefined &&
              finalUsage.completion_tokens !== undefined
            ) {
              credits = calculateContinueChatCredits({
                promptTokens: finalUsage.prompt_tokens,
                completionTokens: finalUsage.completion_tokens,
              });
            } else if (completionText) {
              // APIMart's streaming response does not document a usage chunk.
              // Estimate from the generated text so credit billing still works.
              credits = calculateContinueChatCredits({
                promptTokens: estimateMessageTokens(body.messages),
                completionTokens: estimateCompletionTokens(completionText),
              });

              logger.error("[llm] stream usage missing; billed estimated tokens", {
                route: "chat-continue",
                completionChars: completionText.length,
                credits,
              });
            }

            if (credits !== null) {
              await deps.decreaseCredits({
                user_uuid,
                trans_type: CreditsTransType.ChatContinue,
                credits,
              });
            }
          } catch (error) {
            logger.error("continue chat stream or billing failed:", error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") ||
            "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      return respErr(`Continue chat failed: ${error}`);
    }
  };
}
