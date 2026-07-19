import "@/lib/logger";
import { NextResponse } from "next/server";

import {
  buildOcPrompt,
  normalizeOcRequest,
  parseOcModelResponse,
} from "@/app/api/oc-generate/_lib";
import {
  commitCreativeQuotaCharge,
  creativeQuotaErrorResponse,
  prepareCreativeQuota,
  withCreativeVisitorCookie,
} from "@/lib/creative-quota";
import {
  ocConceptsRequestSchema,
  ocProfileRequestSchema,
  ocRerollRequestSchema,
  type OcConceptsRequest,
  type OcProfileRequest,
  type OcRerollRequest,
} from "@/lib/oc-schema";

function respErr(message: string, code = -1, status = 200) {
  return NextResponse.json({ code, message }, { status });
}

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY || "";
  if (!secret) {
    // Local dev / test environments without a configured secret skip verification
    // so the flow is exercisable end-to-end. Production sets the secret.
    console.warn("TURNSTILE_SECRET_KEY not configured, skipping verification");
    return true;
  }

  try {
    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);

    const result = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData }
    );

    const outcome = await result.json();
    return outcome.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

const UPSTREAM_MODEL = "gemini-2.5-flash";

async function callUpstream(prompt: string): Promise<string> {
  const apiKey = process.env.GRSAI_API_KEY;
  const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";

  if (!apiKey) {
    throw new Error("API KEY not found");
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: UPSTREAM_MODEL,
      stream: false,
      messages: [
        {
          role: "system",
          content:
            "You are an original-character designer for writers, roleplayers, and game masters. You always return strict JSON when asked.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response body from API");
  }
  return content;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return respErr("Invalid request body");
  }

  if (!body?.turnstileToken) {
    return respErr("Verification required");
  }

  // Shape validation up front — surfaces 400s before spending a Turnstile call.
  const operation: string = body?.operation;

  let conceptsRequest: OcConceptsRequest | null = null;
  let profileRequest: OcProfileRequest | null = null;
  let rerollRequest: OcRerollRequest | null = null;

  if (operation === "concepts") {
    const parsed = ocConceptsRequestSchema.safeParse(body);
    if (!parsed.success) return respErr("Invalid concepts request");
    conceptsRequest = parsed.data;
  } else if (operation === "profile") {
    const parsed = ocProfileRequestSchema.safeParse(body);
    if (!parsed.success) return respErr("Invalid profile request");
    profileRequest = parsed.data;
  } else if (operation === "reroll") {
    const parsed = ocRerollRequestSchema.safeParse(body);
    if (!parsed.success) return respErr("Invalid reroll request");
    rerollRequest = parsed.data;
  } else {
    return respErr("Unknown operation");
  }

  const turnstileOk = await verifyTurnstileToken(body.turnstileToken);
  if (!turnstileOk) {
    return respErr("Verification failed. Try again.");
  }

  // The public UI has no model selector; the internal "creative" key activates
  // the existing page-scoped quota and credit flow while the provider model
  // stays fixed at gemini-2.5-flash.
  const quotaGate = await prepareCreativeQuota({
    pageKey: "oc-generator",
    model: "creative",
    request: req,
  });
  const quotaError = creativeQuotaErrorResponse(quotaGate);
  if (quotaError) return quotaError;

  try {
    if (conceptsRequest) {
      const input = normalizeOcRequest({
        mode: conceptsRequest.mode,
        world: conceptsRequest.world,
        role: conceptsRequest.role,
        constraints: conceptsRequest.constraints,
        locale: conceptsRequest.locale,
      });
      const prompt = buildOcPrompt({ operation: "concepts", input });
      const raw = await callUpstream(prompt);
      const concepts = parseOcModelResponse(raw, "concepts");
      await commitCreativeQuotaCharge(quotaGate);
      return withCreativeVisitorCookie(
        NextResponse.json({ operation: "concepts", concepts }),
        quotaGate
      );
    }

    if (profileRequest) {
      const input = normalizeOcRequest({
        mode: profileRequest.mode,
        world: profileRequest.world,
        role: profileRequest.role,
        constraints: profileRequest.constraints,
        locale: profileRequest.locale,
      });
      const prompt = buildOcPrompt({
        operation: "profile",
        input,
        concept: profileRequest.concept,
      });
      const raw = await callUpstream(prompt);
      const profile = parseOcModelResponse(raw, "profile");
      await commitCreativeQuotaCharge(quotaGate);
      return withCreativeVisitorCookie(
        NextResponse.json({ operation: "profile", profile }),
        quotaGate
      );
    }

    if (rerollRequest) {
      const prompt = buildOcPrompt({
        operation: "reroll",
        input: {
          mode: "general",
          world: "",
          role: "",
          constraints: "",
          locale: "en",
        },
        profile: rerollRequest.profile,
        fields: rerollRequest.fields,
        lockedFields: rerollRequest.lockedFields,
      });
      const raw = await callUpstream(prompt);
      const changes = parseOcModelResponse(raw, "reroll");
      await commitCreativeQuotaCharge(quotaGate);
      return withCreativeVisitorCookie(
        NextResponse.json({ operation: "reroll", changes }),
        quotaGate
      );
    }

    return respErr("Unknown operation");
  } catch (error: any) {
    console.error("oc generate failed", error);
    return withCreativeVisitorCookie(
      respErr(error?.message || "Failed to generate OC"),
      quotaGate
    );
  }
}
