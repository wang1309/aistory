import { buildComicPrompt } from "@/lib/comic-prompt";
import { ComicGenerateRequest } from "@/types/comic";
import {
  commitCreativeQuotaCharge,
  creativeQuotaErrorResponse,
  prepareCreativeQuota,
  withCreativeVisitorCookie,
} from "@/lib/creative-quota";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
const GRSAI_API_KEY = process.env.GRSAI_API_KEY || "";
const GRSAI_BASE_URL = process.env.GRSAI_BASE_URL || "https://api.grsai.com";

const modelMap: Record<string, string> = {
  fast: "gemini-2.5-flash",
  standard: "gemini-3.1-flash-lite",
  creative: "gemini-3-flash",
};

async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    console.warn("TURNSTILE_SECRET_KEY not configured, skipping verification");
    return true;
  }

  try {
    const formData = new FormData();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", token);

    const result = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData }
    );

    const outcome = await result.json();
    return outcome.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body: ComicGenerateRequest = await req.json();

    const {
      turnstileToken,
      prompt,
      model,
      locale,
      characters,
      comicStyle,
      panelCount,
      tone,
      setting,
      narrationMode,
      sceneGoal,
      readingFormat,
    } = body;

    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyTurnstileToken(turnstileToken);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Turnstile verification failed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const quotaGate = await prepareCreativeQuota({
      pageKey: "comic-generator",
      model,
      request: req,
    });
    const quotaError = creativeQuotaErrorResponse(quotaGate);
    if (quotaError) return quotaError;

    if (!GRSAI_API_KEY) {
      return withCreativeVisitorCookie(new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ), quotaGate);
    }

    const finalPrompt = buildComicPrompt({
      prompt,
      model,
      locale: locale || "en",
      characters,
      comicStyle,
      panelCount,
      tone,
      setting,
      narrationMode,
      sceneGoal,
      readingFormat,
    });

    const modelName = modelMap[model] || modelMap.standard;

    const response = await fetch(`${GRSAI_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GRSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content:
              "You are a professional comic script writer with deep expertise in manga, webtoon, and western comics. You specialize in crafting panel-by-panel scripts with natural dialogue, clear visual descriptions, and strong narrative pacing.",
          },
          {
            role: "user",
            content: finalPrompt,
          },
        ],
        stream: true,
        temperature: model === "creative" ? 0.9 : 0.75,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GRSAI API error:", errorText);
      return withCreativeVisitorCookie(new Response(
        JSON.stringify({ error: "Failed to generate comic script" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ), quotaGate);
    }

    await commitCreativeQuotaCharge(quotaGate);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let insideThinkTag = false;
    let buffer = "";

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        buffer += text;

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              let content = parsed.choices?.[0]?.delta?.content || "";

              if (content) {
                if (content.includes("<think>")) {
                  insideThinkTag = true;
                  const idx = content.indexOf("<think>");
                  content = idx > 0 ? content.substring(0, idx) : "";
                }

                if (content.includes("</think>")) {
                  insideThinkTag = false;
                  const idx = content.indexOf("</think>");
                  content = content.substring(idx + 8);
                }

                if (insideThinkTag) continue;

                if (content) {
                  const escaped = content
                    .replace(/\\/g, "\\\\")
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/\t/g, "\\t");

                  controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      },

      flush(controller) {
        if (buffer.trim() && buffer.startsWith("data: ")) {
          const data = buffer.slice(6);
          if (data !== "[DONE]") {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content && !insideThinkTag) {
                const escaped = content
                  .replace(/\\/g, "\\\\")
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, "\\n")
                  .replace(/\r/g, "\\r")
                  .replace(/\t/g, "\\t");
                controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      },
    });

    const transformedStream = response.body?.pipeThrough(transformStream);

    return withCreativeVisitorCookie(new Response(transformedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    }), quotaGate);
  } catch (error) {
    console.error("Comic generation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
