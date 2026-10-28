import { fetchChatCompletion, resolveModelTier } from "@/lib/llm";
import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";
import { getGenreStoryGeneratorByGenre } from "@/lib/genre-story-generators";
import {
  commitCreativeQuotaCharge,
  creativeQuotaErrorResponse,
  prepareCreativeQuota,
  withCreativeVisitorCookie,
} from "@/lib/creative-quota";
import { buildGenreStoryPrompt, parseGenreStoryRequest } from "./_lib";

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true;

  try {
    const cached = await isIdentityVerifiedInKv();
    if (cached) return true;
  } catch (error) {
    console.log("Turnstile KV cache check failed (Genre Story)", error);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secretKey, response: token }),
      }
    );
    const data = await response.json();
    const success = data.success === true;

    if (success) {
      try {
        await markIdentityVerifiedInKv();
      } catch (error) {
        console.log("Turnstile KV cache write failed (Genre Story)", error);
      }
    }

    return success;
  } catch (error) {
    console.log("Turnstile verification error (Genre Story)", error);
    return false;
  }
}

function escapeProtocolChunk(content: string): string {
  return content
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as Record<string, unknown>;
    const parsed = parseGenreStoryRequest(raw);
    if (!parsed.ok) {
      return respErr(parsed.error);
    }

    const input = parsed.value;
    const generator = getGenreStoryGeneratorByGenre(input.genre);
    if (!generator) {
      return respErr("Unsupported genre");
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (secretKey) {
      if (!raw.turnstileToken || typeof raw.turnstileToken !== "string") {
        return respErr("Verification required");
      }
      if (!(await verifyTurnstileToken(raw.turnstileToken))) {
        return respErr("Verification failed");
      }
    }

    const quotaGate = await prepareCreativeQuota({
      pageKey: generator.pageKey,
      model: input.model,
      request: req,
    });
    const quotaError = creativeQuotaErrorResponse(quotaGate);
    if (quotaError) {
      return withCreativeVisitorCookie(quotaError, quotaGate);
    }

    const finalPrompt = buildGenreStoryPrompt(input);
    const response = await fetchChatCompletion({
      body: {
        model: resolveModelTier(input.model),
        stream: true,
        messages: [
          {
            role: "system",
            content:
              "You are a professional fiction writer. You write complete, original stories in the requested genre and length. You never copy an existing franchise, never expose hidden reasoning, and never break the requested output format.",
          },
          { role: "user", content: finalPrompt },
        ],
      },
    });

    if (!response.ok) {
      console.log("AI API error (Genre Story):", response.status);
      return withCreativeVisitorCookie(
        respErr(`API Error: ${response.status}`),
        quotaGate
      );
    }

    if (!response.body) {
      return withCreativeVisitorCookie(
        respErr("No response body from API"),
        quotaGate
      );
    }

    await commitCreativeQuotaCharge(quotaGate);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = "";
    let insideThinkTag = false;

    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsedLine = JSON.parse(data);
            let content = parsedLine.choices?.[0]?.delta?.content;
            if (typeof content !== "string" || !content) continue;

            if (content.includes("<think>")) {
              insideThinkTag = true;
              const index = content.indexOf("<think>");
              content = index > 0 ? content.slice(0, index) : "";
            }

            if (content.includes("</think>")) {
              insideThinkTag = false;
              const index = content.indexOf("</think>");
              content = content.slice(index + 8);
            }

            if (insideThinkTag || !content) continue;

            controller.enqueue(
              encoder.encode(`0:"${escapeProtocolChunk(content)}"\n`)
            );
          } catch {
            // Ignore malformed provider chunks; the next chunk may be valid.
          }
        }
      },
      flush(controller) {
        if (!buffer.trim() || !buffer.startsWith("data: ")) return;
        const data = buffer.slice(6);
        if (data === "[DONE]") return;

        try {
          const parsedLine = JSON.parse(data);
          const content = parsedLine.choices?.[0]?.delta?.content;
          if (typeof content === "string" && content) {
            controller.enqueue(
              encoder.encode(`0:"${escapeProtocolChunk(content)}"\n`)
            );
          }
        } catch {
          // Ignore an incomplete final provider chunk.
        }
      },
    });

    return withCreativeVisitorCookie(
      new Response(response.body.pipeThrough(transformStream), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
        },
      }),
      quotaGate
    );
  } catch (error) {
    console.log(
      "Genre story generation failed:",
      error instanceof Error ? error.name : "unknown"
    );
    return respErr("Story generation failed. Please try again.");
  }
}
