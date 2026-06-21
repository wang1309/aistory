import "@/lib/logger";
import { respErr } from "@/lib/resp";
import {
  buildYoutubeNamePrompt,
  normalizeYoutubeNameRequest,
  parseYoutubeNameResponse,
  resolveYoutubeNameModelConfig,
} from "./_lib";
import type { YoutubeNameGenerateRouteRequest } from "@/types/youtube-name";

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
    console.log("Turnstile verification error (YouTube Name Gen):", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body: YoutubeNameGenerateRouteRequest = await req.json();
    const { turnstileToken } = body ?? {};

    if (!turnstileToken) {
      return respErr("verification required");
    }

    const normalized = normalizeYoutubeNameRequest(body ?? {});

    if (!normalized.niche) {
      return respErr("niche is required");
    }

    if (!normalized.audience) {
      return respErr("audience is required");
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

    const prompt = buildYoutubeNamePrompt(normalized);
    const { modelName, temperature } = resolveYoutubeNameModelConfig();

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        temperature,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("YouTube name upstream API error", response.status);
      return respErr("Failed to generate YouTube names");
    }

    const data = await response.json();
    const content: string =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "";

    if (!content.trim()) {
      return respErr("Empty response from upstream model");
    }

    try {
      const parsed = parseYoutubeNameResponse(content);
      return Response.json(parsed);
    } catch (parseError) {
      console.error("YouTube name parse failed:", parseError, content.slice(0, 500));
      return respErr("Failed to parse YouTube name response");
    }
  } catch (error) {
    console.error("YouTube name generation error:", error);
    return respErr("bad request");
  }
}
