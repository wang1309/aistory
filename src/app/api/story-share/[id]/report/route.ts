import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findShareByShareId } from "@/models/story-share";
import { insertFeedback } from "@/models/feedback";
import { verifyTurnstileToken } from "@/lib/turnstile-verify";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Report a public share. Writes into sg_feedbacks (status="report") so the
 * existing admin feedback pipeline can review and takedown (status=banned).
 */
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" ? body.reason.slice(0, 1000) : "";

    // Anti-abuse: per-identity rate limit + Turnstile (reports are anonymous-write).
    const rl = await rateLimit("share-report", 5, 3600);
    if (!rl.ok) {
      return respErr("too many requests");
    }

    const turnstileToken = (body as { turnstileToken?: string })?.turnstileToken;
    if (!turnstileToken) {
      return respErr("verification required");
    }
    const valid = await verifyTurnstileToken(turnstileToken);
    if (!valid) {
      return respErr("verification failed");
    }

    const share = await findShareByShareId(id);
    if (!share) {
      return respErr("not found");
    }

    const user_uuid = (await getUserUuid()) || null;

    await insertFeedback({
      status: "report",
      user_uuid,
      content: `share:${id} | ${reason || "no reason provided"}`,
      rating: null,
      created_at: new Date(),
    });

    return respData({ ok: true });
  } catch (e) {
    console.log("report story share failed", e);
    return respErr("report failed");
  }
}
