import { respData, respErr } from "@/lib/resp";

import { getUserUuid } from "@/services/user";
import { insertFeedback } from "@/models/feedback";
import { getUuid } from "@/lib/hash";


// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  console.log("=== Turnstile Verification Debug ===");
  console.log("Token received:", token);
  console.log("Secret key configured:", secretKey ? "Yes" : "No");

  if (!secretKey) {
    console.log("TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  try {
    const requestBody = {
      secret: secretKey,
      response: token,
    };

    console.log("Sending verification request to Cloudflare...");

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();
    console.log("Cloudflare response:", JSON.stringify(data, null, 2));

    if (data.success) {
      console.log("✓ Verification successful");
    } else {
      console.log("✗ Verification failed");
      console.log("Error codes:", data["error-codes"]);
    }

    return data.success === true;
  } catch (error) {
    console.log("Turnstile verification error:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    let { content, rating, turnstileToken } = await req.json();

    console.log("=== Add Feedback Request ===");
    console.log("Content:", content ? "Provided" : "Missing");
    console.log("Rating:", rating);
    console.log("Turnstile Token:", turnstileToken ? `Provided (length: ${turnstileToken.length})` : "Missing");

    if (!content) {
      return respErr("invalid params");
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      console.log("No turnstile token provided");
      return respErr("verification required");
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      console.log("Turnstile token validation failed");
      return respErr("verification failed");
    }

    console.log("✓ Turnstile verification passed");

    let user_uuid = await getUserUuid();

    // 如果用户未登录，生成匿名用户ID
    if (!user_uuid) {
      user_uuid = `anonymous-${getUuid()}`;
      console.log("Anonymous user feedback, generated ID:", user_uuid);
    } else {
      console.log("Logged in user feedback, user_uuid:", user_uuid);
    }

    const feedback = {
      user_uuid: user_uuid,
      content: content,
      rating: rating,
      created_at: new Date(),
      status: "created",
    };

    const dbFeedback = await insertFeedback(feedback);

    return respData(dbFeedback);
  } catch (e) {
    console.log("add feedback failed", e);
    return respErr("add feedback failed");
  }
}
