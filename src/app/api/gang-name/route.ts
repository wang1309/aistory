import { NextResponse } from "next/server";

import {
  generateGangNames,
  validateGangNameRequest,
} from "@/app/api/gang-name/_lib";
import type { GangNameRouteRequest } from "@/types/gang-name-generator";
import {
  commitCreativeQuotaCharge,
  creativeQuotaErrorResponse,
  prepareCreativeQuota,
  withCreativeVisitorCookie,
} from "@/lib/creative-quota";

function respErr(message: string, code = -1, status = 200) {
  return NextResponse.json({ code, message }, { status });
}

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY || "";
  if (!secret) {
    // Secret not configured (e.g. local dev / test) — skip verification.
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GangNameRouteRequest;
    const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    if (!token) return respErr("Verification failed. Try again.");

    const validated = validateGangNameRequest(body);
    if (!validated.ok) return respErr(validated.message);
    if (!(await verifyTurnstileToken(token))) {
      return respErr("Verification failed. Try again.");
    }

    const quotaGate = await prepareCreativeQuota({
      pageKey: "gang-name-generator",
      model: validated.value.mode,
      request: req,
    });
    const quotaError = creativeQuotaErrorResponse(quotaGate);
    if (quotaError) return quotaError;

    try {
      const result = await generateGangNames(validated.value);
      await commitCreativeQuotaCharge(quotaGate);
      return withCreativeVisitorCookie(
        NextResponse.json(result),
        quotaGate
      );
    } catch (error) {
      // Do not log request fields, tokens, prompt, upstream body, or AI output.
      console.error("gang name generation failed", error);
      return withCreativeVisitorCookie(
        respErr("Unable to generate gang names. Please try again."),
        quotaGate
      );
    }
  } catch (error) {
    // Do not log request fields, tokens, prompt, upstream body, or AI output.
    console.error("gang name request failed", error);
    return respErr("Unable to generate gang names. Please try again.");
  }
}
