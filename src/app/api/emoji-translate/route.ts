import { NextResponse } from "next/server";

import {
  generateEmojiTranslation,
  normalizeEmojiTranslatorRequest,
} from "@/app/api/emoji-translate/_lib";
import type { EmojiTranslatorRouteRequest } from "@/types/emoji-translator";

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
    const body = (await req.json()) as EmojiTranslatorRouteRequest;

    if (!body.turnstileToken) {
      return respErr("Verification failed. Try again.");
    }

    const normalized = normalizeEmojiTranslatorRequest(body);

    if (!normalized.text) {
      return respErr("Text is required.");
    }
    if (normalized.text.length > 500) {
      return respErr("Text must be 500 characters or fewer.");
    }
    if (normalized.context.length > 300) {
      return respErr("Context must be 300 characters or fewer.");
    }

    if (!(await verifyTurnstileToken(body.turnstileToken))) {
      return respErr("Verification failed. Try again.");
    }

    return NextResponse.json(await generateEmojiTranslation(normalized));
  } catch (error) {
    // Do not log source text, context, prompt, token, upstream body, or AI output.
    console.error("emoji translator generation failed", error);
    return respErr("Unable to generate emoji suggestions. Please try again.");
  }
}
