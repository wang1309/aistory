import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";
import { buildLiteratureReviewPrompt, parseLiteratureReviewInput } from "./_lib";
import {
  commitCreativeQuotaCharge,
  creativeQuotaErrorResponse,
  prepareCreativeQuota,
  withCreativeVisitorCookie,
} from "@/lib/creative-quota";

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return false;

  try {
    const cached = await isIdentityVerifiedInKv();
    if (cached) return true;
  } catch (error) {
    console.log("Turnstile KV cache check failed (Literature Review)", error);
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
        console.log("Turnstile KV cache write failed (Literature Review)", error);
      }
    }
    return success;
  } catch (error) {
    console.log("Turnstile verification error (Literature Review)", error);
    return false;
  }
}

interface LiteratureReviewRequest {
  topic?: string;
  researchQuestion?: string;
  assignmentBrief?: string;
  discipline?: string;
  themesOrSources?: string;
  academicLevel?: string;
  reviewLength?: string;
  tone?: string;
  model?: string;
  locale?: string;
  turnstileToken?: string;
}

export async function POST(req: Request) {
  try {
    const requestData = (await req.json()) as LiteratureReviewRequest;
    const { model, turnstileToken } = requestData;

    const parsed = parseLiteratureReviewInput(requestData);
    if (!parsed.ok || !parsed.value) return respErr(parsed.error || "Invalid input");

    if (!model) return respErr("Please select an AI model");
    if (!turnstileToken) return respErr("Verification required");

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) return respErr("Verification failed");

    const quotaGate = await prepareCreativeQuota({
      pageKey: "literature-review-generator",
      model,
      request: req,
    });
    const quotaError = creativeQuotaErrorResponse(quotaGate);
    if (quotaError) return quotaError;

    const apiKey = process.env.GRSAI_API_KEY;
    const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";
    if (!apiKey) return withCreativeVisitorCookie(respErr("API KEY not configured"), quotaGate);

    const finalPrompt = buildLiteratureReviewPrompt(parsed.value);

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
            "You are an experienced academic writing tutor who helps coursework students draft narrative literature reviews. You never fabricate citations or study findings, always flag claims that need verification, and never claim systematic-review methodology. You write in clear, disciplined academic prose adapted to the requested language.",
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
      console.log("GRSAI API error (Literature Review):", response.status, errorText);
      return withCreativeVisitorCookie(respErr(`API request failed: ${response.status}`), quotaGate);
    }
    if (!response.body) return withCreativeVisitorCookie(respErr("No response body from AI service"), quotaGate);

    await commitCreativeQuotaCharge(quotaGate);

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
              console.log("Failed to parse SSE data (Literature Review):", error);
            }
          }
        } catch (error) {
          console.log("Transform error (Literature Review):", error);
        }
      },
    });

    return withCreativeVisitorCookie(new Response(response.body.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    }), quotaGate);
  } catch (error) {
    console.log("Literature review generation error:", error);
    return respErr(`Literature review generation failed: ${error}`);
  }
}
