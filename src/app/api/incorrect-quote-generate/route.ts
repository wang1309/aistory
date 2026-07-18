import "@/lib/logger";
import { respErr } from "@/lib/resp";
import {
  buildIncorrectQuotePrompt,
  createIncorrectQuoteTransformStream,
  normalizeIncorrectQuoteRequest,
  resolveIncorrectQuoteModelConfig,
} from "./_lib";
import type { IncorrectQuoteGenerateRequest } from "@/types/incorrect-quote";
import {
  commitCreativeQuotaCharge,
  creativeQuotaErrorResponse,
  prepareCreativeQuota,
  withCreativeVisitorCookie,
} from "@/lib/creative-quota";

type IncorrectQuoteGenerateRouteRequest = IncorrectQuoteGenerateRequest & {
  turnstileToken?: string;
};

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
    console.log("Turnstile verification error (Incorrect Quote Gen):", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body: IncorrectQuoteGenerateRouteRequest = await req.json();
    const { turnstileToken } = body ?? {};

    if (!turnstileToken) {
      return respErr("verification required");
    }

    const normalized = normalizeIncorrectQuoteRequest(body ?? {});

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return respErr("verification failed");
    }

    const quotaGate = await prepareCreativeQuota({
      pageKey: "incorrect-quote-generator",
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

    const prompt = buildIncorrectQuotePrompt(normalized);
    const { modelName, temperature } = resolveIncorrectQuoteModelConfig(
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
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      console.error("Incorrect quote upstream API error", response.status);
      return withCreativeVisitorCookie(
        respErr("Failed to generate incorrect quote"),
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
      new Response(response.body.pipeThrough(createIncorrectQuoteTransformStream()), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
        },
      }),
      quotaGate
    );
  } catch (error) {
    console.error("Incorrect quote generation error", error);
    return respErr("bad request");
  }
}
