import { fetchChatCompletion, isModelTier, resolveModelTier } from "@/lib/llm";
import { buildDialoguePrompt } from "@/lib/dialogue-prompt";
import { DialogueGenerateRequest } from "@/types/dialogue";
import {
  commitCreativeQuotaCharge,
  creativeQuotaErrorResponse,
  prepareCreativeQuota,
  withCreativeVisitorCookie,
} from "@/lib/creative-quota";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

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
      {
        method: "POST",
        body: formData,
      }
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
    const body: DialogueGenerateRequest = await req.json();

    const {
      turnstileToken,
      prompt,
      model,
      locale,
      characters,
      dialogueType,
      tone,
      length,
      setting,
      includeNarration,
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

    const quotaModel = isModelTier(model) ? model : "standard";

    const quotaGate = await prepareCreativeQuota({
      pageKey: "dialogue-generator",
      model: quotaModel,
      request: req,
    });
    const quotaError = creativeQuotaErrorResponse(quotaGate);
    if (quotaError) return quotaError;

    const finalPrompt = buildDialoguePrompt({
      prompt,
      model: quotaModel,
      locale: locale || "en",
      characters,
      dialogueType,
      tone,
      length,
      setting,
      includeNarration,
    });

    const modelName = resolveModelTier(quotaModel);

    const response = await fetchChatCompletion({ body: {
        model: modelName,
        messages: [
          {
            role: "user",
            content: finalPrompt,
          },
        ],
        stream: true,
        temperature: model === "creative" ? 0.9 : 0.7,
        max_tokens: 4096,
      } });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      return withCreativeVisitorCookie(new Response(
        JSON.stringify({ error: "Failed to generate dialogue" }),
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

            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              let content = parsed.choices?.[0]?.delta?.content || "";

              if (content) {
                if (content.includes("<think>")) {
                  insideThinkTag = true;
                  const thinkIndex = content.indexOf("<think>");
                  if (thinkIndex > 0) {
                    content = content.substring(0, thinkIndex);
                  } else {
                    content = "";
                  }
                }

                if (content.includes("</think>")) {
                  insideThinkTag = false;
                  const thinkCloseIndex = content.indexOf("</think>");
                  content = content.substring(thinkCloseIndex + 8);
                }

                if (insideThinkTag) {
                  continue;
                }

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
    console.error("Dialogue generation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
