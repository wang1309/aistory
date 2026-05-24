import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";
import { buildDndBackstoryPrompt, type DndBackstoryLength, type DndBackstoryUseCase } from "./_lib";

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
    console.log("Turnstile KV cache check failed (DnD Backstory)", error);
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
        console.log("Turnstile KV cache write failed (DnD Backstory)", error);
      }
    }

    return success;
  } catch (error) {
    console.log("Turnstile verification error (DnD Backstory)", error);
    return false;
  }
}

interface DndBackstoryRequest {
  prompt?: string;
  model?: string;
  locale?: string;
  race?: string;
  characterClass?: string;
  background?: string;
  alignment?: string;
  campaignTone?: string;
  motivation?: string;
  definingEvent?: string;
  greatestFearOrFlaw?: string;
  importantBond?: string;
  secret?: string;
  hookType?: string;
  useCase?: DndBackstoryUseCase;
  worldNotes?: string;
  partyRole?: string;
  deityOrPatron?: string;
  rivalOrFaction?: string;
  extraConstraints?: string;
  length?: DndBackstoryLength;
  turnstileToken?: string;
}

export async function POST(req: Request) {
  try {
    const requestData = (await req.json()) as DndBackstoryRequest;
    const {
      prompt,
      model,
      locale,
      race,
      characterClass,
      background,
      alignment,
      campaignTone,
      motivation,
      definingEvent,
      greatestFearOrFlaw,
      importantBond,
      secret,
      hookType,
      useCase,
      worldNotes,
      partyRole,
      deityOrPatron,
      rivalOrFaction,
      extraConstraints,
      length,
      turnstileToken,
    } = requestData;

    if (!prompt?.trim()) {
      return respErr("Please provide a character concept");
    }

    if (!race?.trim()) {
      return respErr("Please provide a race or heritage");
    }

    if (!characterClass?.trim()) {
      return respErr("Please provide a class or archetype");
    }

    if (!background?.trim()) {
      return respErr("Please provide a background or origin");
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

    const finalPrompt = buildDndBackstoryPrompt({
      prompt: prompt.trim(),
      locale: locale || "en",
      race: race.trim(),
      characterClass: characterClass.trim(),
      background: background.trim(),
      alignment: alignment?.trim(),
      campaignTone: campaignTone?.trim(),
      motivation: motivation?.trim(),
      definingEvent: definingEvent?.trim(),
      greatestFearOrFlaw: greatestFearOrFlaw?.trim(),
      importantBond: importantBond?.trim(),
      secret: secret?.trim(),
      hookType: hookType?.trim(),
      useCase,
      worldNotes: worldNotes?.trim(),
      partyRole: partyRole?.trim(),
      deityOrPatron: deityOrPatron?.trim(),
      rivalOrFaction: rivalOrFaction?.trim(),
      extraConstraints: extraConstraints?.trim(),
      length,
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
            "You are an expert tabletop RPG character designer specializing in D&D 5e and 5.5e playable backstories. You write concise, table-usable character material with strong motivations, flaws, secrets, and actionable DM hooks.",
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
      console.log("GRSAI API error (DnD Backstory):", response.status, errorText);
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
              console.log("Failed to parse SSE data (DnD Backstory):", error);
            }
          }
        } catch (error) {
          console.log("Transform error (DnD Backstory):", error);
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
    console.log("DnD backstory generation error:", error);
    return respErr(`DnD backstory generation failed: ${error}`);
  }
}
