import { NextResponse } from "next/server";

import {
  generateCityNicknames,
  normalizeCityNicknameRequest,
} from "@/app/api/city-nickname-generate/_lib";
import type { CityNicknameGenerateRouteRequest } from "@/types/city-nickname";

function respErr(message: string, code = -1, status = 200) {
  return NextResponse.json({ code, message }, { status });
}

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY || "";
  if (!secret) {
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

export async function POST(req: Request) {
  const body = (await req.json()) as CityNicknameGenerateRouteRequest;

  if (!body.turnstileToken) {
    return respErr("Verification failed. Try again.");
  }

  const normalized = normalizeCityNicknameRequest(body);

  if (!normalized.cityType) {
    return respErr("City type is required");
  }

  if (!normalized.knownFor) {
    return respErr("What the city is known for is required");
  }

  if (!normalized.nicknameStyles.length) {
    return respErr("At least one nickname style is required");
  }

  const isValid = await verifyTurnstileToken(body.turnstileToken);
  if (!isValid) {
    return respErr("Verification failed. Try again.");
  }

  try {
    const data = await generateCityNicknames(normalized);
    return NextResponse.json(data);
  } catch (error) {
    console.error("city nickname generate failed", error);
    return respErr("Failed to generate city nicknames.");
  }
}
