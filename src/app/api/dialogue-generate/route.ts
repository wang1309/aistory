import { buildDialoguePrompt } from "@/lib/dialogue-prompt";
import { DialogueGenerateRequest } from "@/types/dialogue";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
const GRSAI_API_KEY = process.env.GRSAI_API_KEY || "";

const modelMap: Record<string, string> = {
  fast: "gemini-2.5-flash-lite",
  standard: "gemini-2.5-flash",
  creative: "gemini-2.5-flash-think",
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

    if (!GRSAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const finalPrompt = buildDialoguePrompt({
      prompt,
      model,
      locale: locale || "en",
      characters,
      dialogueType,
      tone,
      length,
      setting,
      includeNarration,
    });

    const modelName = modelMap[model] || modelMap.standard;

    const response = await fetch("https://api.grsai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GRSAI_API_KEY}`,
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GRSAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate dialogue" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

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

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Dialogue generation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
