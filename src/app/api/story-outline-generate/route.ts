import "@/lib/logger";
import { respErr } from "@/lib/resp";
import type {
  StoryOutlineGenerateRequest,
  StoryOutlineGenerateResponse,
} from "@/types/story-outline";
import {
  buildStoryOutlinePrompt,
  normalizeStoryOutlineRequest,
  parseStoryOutlineResponse,
} from "./_lib";

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY not configured, skipping verification");
    return true;
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
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification error (Story Outline Gen):", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body: StoryOutlineGenerateRequest = await req.json();
    const { turnstileToken } = body ?? {};

    if (!turnstileToken) {
      return respErr("verification required");
    }

    const normalized = normalizeStoryOutlineRequest(body ?? {});

    if (!normalized.storyIdea) {
      return respErr("story idea is required");
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return respErr("verification failed");
    }

    const apiKey = process.env.GRSAI_API_KEY;
    const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";

    if (!apiKey) {
      return respErr("API KEY not found");
    }

    const prompt = buildStoryOutlinePrompt(normalized);

    const upstream = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gemini-3.1-flash-lite",
        stream: false,
        temperature: 0.8,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!upstream.ok) {
      console.error("Story outline upstream API error", upstream.status);
      return respErr("Failed to generate story outline");
    }

    const data = await upstream.json();
    const rawContent: string =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "";

    if (!rawContent.trim()) {
      return respErr("Empty response from upstream model");
    }

    try {
      const parsed = parseStoryOutlineResponse(rawContent);
      const response: StoryOutlineGenerateResponse = { outline: parsed };
      return Response.json(response);
    } catch (parseError) {
      console.error(
        "Story outline parse failed:",
        parseError,
        rawContent.slice(0, 500)
      );
      return respErr("Failed to parse story outline response");
    }
  } catch (error) {
    console.error("Story outline generation error:", error);
    return respErr("bad request");
  }
}
