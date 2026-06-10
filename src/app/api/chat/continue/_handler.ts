import { respErr } from "@/lib/resp";
import {
  CreditsTransType,
  decreaseCredits,
  getUserCredits,
} from "@/services/credit";
import { getUserUuid, isCurrentUserAdmin } from "@/services/user";
import {
  buildAgnesChatRequest,
  createAgnesHeaders,
  type AgnesChatRequestInput,
} from "../_lib";
import { calculateContinueChatCredits, estimateMaxContinueChatCredits } from "./_lib";

type ContinueChatRequest = AgnesChatRequestInput & {
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
  isCurrentUserAdmin: typeof isCurrentUserAdmin;
  getUserCredits: typeof getUserCredits;
  decreaseCredits: typeof decreaseCredits;
  fetchAgnes: (payload: AgnesChatRequestInput) => Promise<Response>;
};

function getDefaultDependencies(): ContinueChatDependencies {
  return {
    getUserUuid,
    isCurrentUserAdmin,
    getUserCredits,
    decreaseCredits,
    fetchAgnes: async (payload) => {
      const apiKey = process.env.AGNES_API_KEY;
      if (!apiKey) {
        throw new Error("AGNES_API_KEY not configured");
      }

      const baseUrl = (process.env.AGNES_BASE_URL || "https://apihub.agnes-ai.com").replace(
        /\/$/,
        ""
      );

      return fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: createAgnesHeaders(apiKey),
        body: JSON.stringify(payload),
      });
    },
  };
}

function parseUsageFromSseLine(line: string): Usage | null {
  if (!line.startsWith("data: ")) {
    return null;
  }

  const data = line.slice(6);
  if (data === "[DONE]") {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as { usage?: Usage };
    return parsed.usage || null;
  } catch {
    return null;
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

      const user_uuid = await deps.getUserUuid();
      if (!user_uuid) {
        return respErr("no auth");
      }

      const isAdmin = await deps.isCurrentUserAdmin();
      if (!isAdmin) {
        const estimatedMaxCredits = estimateMaxContinueChatCredits({
          messages: body.messages,
          maxTokens: body.max_tokens,
        });

        const userCredits = await deps.getUserCredits(user_uuid);
        if ((userCredits.left_credits || 0) < estimatedMaxCredits) {
          return respErr("insufficient credits");
        }
      }

      const upstreamPayload = buildAgnesChatRequest({
        ...body,
        stream: true,
      });

      const upstream = await deps.fetchAgnes(upstreamPayload);
      if (!upstream.ok) {
        const errorText = await upstream.text();
        return respErr(`Agnes API error: ${upstream.status} ${errorText}`);
      }

      if (!upstream.body) {
        return respErr("No response body from Agnes API");
      }

      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      let finalUsage: Usage | null = null;

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
                const usage = parseUsageFromSseLine(line);
                if (usage) {
                  finalUsage = usage;
                }
              }

              controller.enqueue(encoder.encode(chunk));
            }

            if (buffer) {
              const usage = parseUsageFromSseLine(buffer);
              if (usage) {
                finalUsage = usage;
              }
            }

            if (
              !isAdmin &&
              finalUsage?.prompt_tokens !== undefined &&
              finalUsage.completion_tokens !== undefined
            ) {
              const credits = calculateContinueChatCredits({
                promptTokens: finalUsage.prompt_tokens,
                completionTokens: finalUsage.completion_tokens,
              });

              await deps.decreaseCredits({
                user_uuid,
                trans_type: CreditsTransType.ChatContinue,
                credits,
              });
            }
          } catch (error) {
            console.log("continue chat stream or billing failed:", error);
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
