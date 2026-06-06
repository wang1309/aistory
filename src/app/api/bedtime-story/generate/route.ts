import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";
import { buildBedtimeStoryPrompt, type BedtimeStoryLength, type BedtimeStoryAgeGroup } from "./_lib";

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return false;
  }

  try {
    const cached = await isIdentityVerifiedInKv();
    if (cached) {
      return true;
    }
  } catch (error) {
    console.log("Turnstile KV cache check failed (Bedtime Story)", error);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    const success = data.success === true;

    if (success) {
      try {
        await markIdentityVerifiedInKv();
      } catch (error) {
        console.log("Turnstile KV cache write failed (Bedtime Story)", error);
      }
    }

    return success;
  } catch (error) {
    console.log("Turnstile verification error (Bedtime Story)", error);
    return false;
  }
}

interface BedtimeStoryRequest {
  prompt?: string;
  model?: string;
  locale?: string;
  ageGroup?: BedtimeStoryAgeGroup;
  storyTheme?: string;
  length?: BedtimeStoryLength;
  endingMood?: string;
  moralLesson?: string;
  childName?: string;
  turnstileToken?: string;
}

export async function POST(req: Request) {
  try {
    const requestData = (await req.json()) as BedtimeStoryRequest;
    const {
      prompt,
      model,
      locale,
      ageGroup,
      storyTheme,
      length,
      endingMood,
      moralLesson,
      childName,
      turnstileToken,
    } = requestData;

    if (!prompt?.trim()) {
      return respErr("Please provide a story idea");
    }

    if (!model) {
      return respErr("Please select an AI model");
    }

    if (!turnstileToken) {
      return respErr("Verification required");
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return respErr("Verification failed");
    }

    const apiKey = process.env.GRSAI_API_KEY;
    const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";

    if (!apiKey) {
      return respErr("API KEY not configured");
    }

    const finalPrompt = buildBedtimeStoryPrompt({
      prompt: prompt.trim(),
      locale: locale || "en",
      ageGroup: ageGroup || "preschool",
      storyTheme: storyTheme || "adventure",
      length: length || "medium",
      endingMood: endingMood || "happy",
      moralLesson: moralLesson?.trim(),
      childName: childName?.trim(),
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
            "You are a professional children's author who specializes in gentle, age-appropriate bedtime stories. You write with warmth, imagination, and a calming tone that helps children relax and drift off to sleep. Your stories are always safe, positive, and age-appropriate.",
        },
        {
          role: "user",
          content: finalPrompt,
        },
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
      console.log("GRSAI API error (Bedtime Story):", response.status, errorText);
      return respErr(`API request failed: ${response.status}`);
    }

    if (!response.body) {
      return respErr("No response body from AI service");
    }

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
              console.log("Failed to parse SSE data (Bedtime Story):", error);
            }
          }
        } catch (error) {
          console.log("Transform error (Bedtime Story):", error);
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
    console.log("Bedtime story generation error:", error);
    return respErr(`Bedtime story generation failed: ${error}`);
  }
}
