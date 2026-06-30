import { respData, respErr } from "@/lib/resp";
import { verifyTurnstileToken } from "@/lib/turnstile-verify";
import { containsBannedContent } from "@/lib/content-filter";
import { getShareId, getShareDeleteToken } from "@/lib/hash";
import { getUserUuid } from "@/services/user";
import { insertShare, findShareByShareId } from "@/models/story-share";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_SOURCE_CATEGORIES = [
  "story",
  "title",
  "fanfic",
  "plot",
  "poem",
  "dialogue",
  "quote",
  "comic",
  "outline",
  "bedtime",
  "fantasy",
  "romance",
  "backstory",
  "dnd-backstory",
  "prompt",
  "comment",
  "nickname",
];

const MAX_CONTENT_LEN = 20000;
const MAX_PROMPT_LEN = 5000;

function buildShareUrl(share_id: string): string {
  const base =
    process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  return `${base}/share/${share_id}`;
}

/** Generate a share_id that does not collide with an existing row. */
async function uniqueShareId(): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const id = getShareId();
    const exist = await findShareByShareId(id);
    if (!exist) return id;
  }
  // astronomically unlikely fallback
  return getShareId();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, content, prompt, settings, sourceCategory, turnstileToken } =
      body || {};

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return respErr("invalid params");
    }
    if (content.length > MAX_CONTENT_LEN) {
      return respErr("content too long");
    }

    // Anti-abuse: per-identity rate limit on anonymous DB writes.
    const rl = await rateLimit("share-create", 10, 3600);
    if (!rl.ok) {
      return respErr("too many requests");
    }

    // Anti-bot: Turnstile required (anonymous-friendly, but not bot-friendly)
    if (!turnstileToken) {
      return respErr("verification required");
    }
    const valid = await verifyTurnstileToken(turnstileToken);
    if (!valid) {
      return respErr("verification failed");
    }

    // Content filter (keyword blocklist)
    const ban = containsBannedContent(`${title || ""}\n${prompt || ""}\n${content}`);
    if (ban.hit) {
      return respErr("content blocked");
    }

    // Optional owner binding — anonymous users simply get null
    const user_uuid = (await getUserUuid()) || null;

    const share_id = await uniqueShareId();
    const delete_token = getShareDeleteToken();

    let sourceCategoryValue: string | null = null;
    if (
      typeof sourceCategory === "string" &&
      ALLOWED_SOURCE_CATEGORIES.includes(sourceCategory)
    ) {
      sourceCategoryValue = sourceCategory;
    }

    const now = new Date();
    const share = await insertShare({
      share_id,
      title: typeof title === "string" ? title.slice(0, 200) : null,
      content,
      prompt: typeof prompt === "string" ? prompt.slice(0, MAX_PROMPT_LEN) : null,
      settings: settings ?? null,
      source_category: sourceCategoryValue,
      user_uuid,
      delete_token,
      status: "visible",
      view_count: 0,
      created_at: now,
      updated_at: now,
    });

    if (!share) {
      return respErr("create share failed");
    }

    return respData({
      share_id: share.share_id,
      url: buildShareUrl(share.share_id),
      delete_token: share.delete_token,
      title: share.title,
    });
  } catch (e) {
    console.log("create story share failed", e);
    return respErr("create share failed");
  }
}
