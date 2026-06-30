import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "./turnstile-kv";

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Extracted here so multiple public-write APIs (story generation, story share)
 * share the same verification + KV short-circuit without code duplication.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey || !token) {
    return false;
  }

  try {
    const cached = await isIdentityVerifiedInKv();
    if (cached) {
      return true;
    }
  } catch {
    // ignore KV cache read failure, fall through to remote verify
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secretKey, response: token }),
      }
    );
    const data = await res.json();
    const success = data.success === true;

    if (success) {
      try {
        await markIdentityVerifiedInKv();
      } catch {
        // ignore KV cache write failure
      }
    }

    return success;
  } catch {
    return false;
  }
}
