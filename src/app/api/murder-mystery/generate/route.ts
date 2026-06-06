import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";
import { buildMurderMysteryPrompt, type MurderMysteryComplexity } from "./_lib";

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return false;

  try {
    const cached = await isIdentityVerifiedInKv();
    if (cached) return true;
  } catch (error) {
    console.log("Turnstile KV cache check failed (Murder Mystery)", error);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token }),
    });
    const data = await response.json();
    const success = data.success === true;
    if (success) {
      try {
        await markIdentityVerifiedInKv();
      } catch (error) {
        console.log("Turnstile KV cache write failed (Murder Mystery)", error);
      }
    }
    return success;
  } catch (error) {
    console.log("Turnstile verification error (Murder Mystery)", error);
    return false;
  }
}

interface MurderMysteryRequest {
  prompt?: string;
  model?: string;
  locale?: string;
  settingType?: string;
  timePeriod?: string;
  playerCount?: string;
  complexity?: MurderMysteryComplexity;
  mysteryType?: string;
  tone?: string;
  turnstileToken?: string;
}

export async function POST(req: Request) {
  try {
    const requestData = (await req.json()) as MurderMysteryRequest;
    const {
      prompt,
      model,
      locale,
      settingType,
      timePeriod,
      playerCount,
      complexity,
      mysteryType,
      tone,
      turnstileToken,
    } = requestData;

    if (!prompt?.trim()) return respErr("Please provide a scenario idea");
    if (!model) return respErr("Please select an AI model");
    if (!turnstileToken) return respErr("Verification required");

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) return respErr("Verification failed");

    const apiKey = process.env.GRSAI_API_KEY;
    const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";
    if (!apiKey) return respErr("API KEY not configured");

    const finalPrompt = buildMurderMysteryPrompt({
      prompt: prompt.trim(),
      locale: locale || "en",
      settingType: settingType || "manor",
      timePeriod: timePeriod || "1920s",
      playerCount: playerCount || "6-10",
      complexity: complexity || "standard",
      mysteryType: mysteryType || "classic_whodunit",
      tone: tone || "serious",
    });

    const modelMap: Record<string, string> = {
      fast: "gemini-2.5-flash",
      standard: "gemini-3.1-flash-lite",
      creative: "gemini-3-flash",
    };
    const actualModel = modelMap[model] || "gemini-3.1-flash-lite";

    const requestBody = {
      model: actualModel,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are an expert murder mystery game designer with 20 years of experience writing party mystery scenarios. You create fair, deducible mysteries with memorable characters, layered clues, and satisfying solutions. Your scenarios are always game-ready and easy for a host to run.",
        },
        { role: "user", content: finalPrompt },
      ],
    };

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("GRSAI API error (Murder Mystery):", response.status, errorText);
      return respErr(`API request failed: ${response.status}`);
    }
    if (!response.body) return respErr("No response body from AI service");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let insideThinkTag = false;
    let buffer = "";

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        try {
          const text = decoder.decode(chunk, { stream: true });
          buffer += text;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              let content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (!content) continue;

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
              if (insideThinkTag || !content.trim()) continue;

              const escaped = content
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"')
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/\t/g, "\\t");
              controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
            } catch (error) {
              console.log("Failed to parse SSE data (Murder Mystery):", error);
            }
          }
        } catch (error) {
          console.log("Transform error (Murder Mystery):", error);
        }
      },
    });

    return new Response(response.body.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.log("Murder mystery generation error:", error);
    return respErr(`Murder mystery generation failed: ${error}`);
  }
}
