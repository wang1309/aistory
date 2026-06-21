import "@/lib/logger";
import { respErr } from "@/lib/resp";
import type {
  YoutubeTitleGenerateRouteRequest,
  YoutubeTitleGenerateResponse,
} from "@/types/youtube-title";
import {
  buildYoutubeTitlePrompt,
  normalizeYoutubeTitleRequest,
  parseYoutubeTitleResponse,
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
    console.error("Turnstile verification error (YouTube Title Gen):", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body: YoutubeTitleGenerateRouteRequest = await req.json();
    const { turnstileToken } = body ?? {};

    if (!turnstileToken) {
      return respErr("verification required");
    }

    const normalized = normalizeYoutubeTitleRequest(body ?? {});

    if (!normalized.videoTopic) {
      return respErr("video topic is required");
    }

    if (!normalized.targetAudience) {
      return respErr("target audience is required");
    }

    if (!normalized.summary) {
      return respErr("summary is required");
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

    const prompt = buildYoutubeTitlePrompt(normalized);

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
      console.error("YouTube title upstream API error", upstream.status);
      return respErr("Failed to generate YouTube titles");
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
      const parsed: YoutubeTitleGenerateResponse = parseYoutubeTitleResponse(
        rawContent,
        normalized.videoTopic
      );
      return Response.json(parsed);
    } catch (parseError) {
      console.error(
        "YouTube title parse failed:",
        parseError,
        rawContent.slice(0, 500)
      );
      return respErr("Failed to parse YouTube title response");
    }
  } catch (error) {
    console.error("YouTube title generation error:", error);
    return respErr("bad request");
  }
}
