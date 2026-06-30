import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  findVisibleShareByShareId,
  hideShareByToken,
  hideShareForUser,
} from "@/models/story-share";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Public read of a share snapshot (for client-side preview / future use).
 * View counting is done in the SSR detail page to avoid double counting.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const share = await findVisibleShareByShareId(id);
    if (!share) {
      return respErr("not found");
    }

    return respData({
      share_id: share.share_id,
      title: share.title,
      content: share.content,
      prompt: share.prompt,
      settings: share.settings,
      source_category: share.source_category,
      view_count: share.view_count,
      created_at: share.created_at,
    });
  } catch (e) {
    console.log("get story share failed", e);
    return respErr("get share failed");
  }
}

/**
 * Soft-delete (status -> hidden). Logged-in creators delete via user_uuid;
 * anonymous creators delete via the delete_token issued at creation time.
 */
export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    let body: { deleteToken?: string } = {};
    try {
      body = await req.json();
    } catch {
      // delete may be sent without a body
    }

    const user_uuid = await getUserUuid();
    if (user_uuid) {
      const ok = await hideShareForUser(id, user_uuid);
      if (ok) return respData({ ok: true });
    }

    if (body.deleteToken) {
      const ok = await hideShareByToken(id, body.deleteToken);
      if (ok) return respData({ ok: true });
    }

    return respErr("not authorized");
  } catch (e) {
    console.log("delete story share failed", e);
    return respErr("delete share failed");
  }
}
