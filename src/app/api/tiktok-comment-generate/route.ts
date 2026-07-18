import "@/lib/logger";
import { respErr } from "@/lib/resp";
import {
  buildTiktokCommentPrompt,
  createTiktokCommentTransformStream,
  normalizeTiktokCommentRequest,
  resolveTiktokCommentModelConfig,
} from "./_lib";
import type { TiktokCommentGenerateRouteRequest } from "@/types/tiktok-comment";
import {
  commitCreativeQuotaCharge,
  creativeQuotaErrorResponse,
  prepareCreativeQuota,
  withCreativeVisitorCookie,
} from "@/lib/creative-quota";

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.log("Turnstile verification error (TikTok Comment Gen):", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body: TiktokCommentGenerateRouteRequest = await req.json();
    const { turnstileToken } = body ?? {};

    if (!turnstileToken) {
      return respErr("verification required");
    }

    const normalized = normalizeTiktokCommentRequest(body ?? {});

    if (!normalized.comment) {
      return respErr("comment is required");
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return respErr("verification failed");
    }

    const quotaGate = await prepareCreativeQuota({
      pageKey: "tiktok-comment-generator",
      model: normalized.mode,
      request: req,
    });
    const quotaError = creativeQuotaErrorResponse(quotaGate);
    if (quotaError) return quotaError;

    const apiKey = process.env.GRSAI_API_KEY;
    const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";

    if (!apiKey) {
      return withCreativeVisitorCookie(respErr("API KEY not found"), quotaGate);
    }

    const prompt = buildTiktokCommentPrompt(normalized);
    const { modelName, temperature } = resolveTiktokCommentModelConfig(
      normalized.mode
    );

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: true,
        temperature,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.error("TikTok comment upstream API error", response.status);
      return withCreativeVisitorCookie(
        respErr("Failed to generate TikTok comment replies"),
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

    return withCreativeVisitorCookie(
      new Response(
        response.body.pipeThrough(createTiktokCommentTransformStream()),
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Content-Type-Options": "nosniff",
          },
        }
      ),
      quotaGate
    );
  } catch (error) {
    console.error("TikTok comment generation error:", error);
    return respErr("bad request");
  }
}
