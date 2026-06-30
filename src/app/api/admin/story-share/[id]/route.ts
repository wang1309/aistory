import { respData, respErr } from "@/lib/resp";
import { isCurrentUserAdmin } from "@/services/user";
import { setShareStatus, StoryShareStatus } from "@/models/story-share";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Admin takedown / restore for a story share.
 * Body: { status: "visible" | "hidden" | "banned" }
 * Closes the loop on user reports (sg_feedbacks status="report").
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return respErr("forbidden");
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const status = body?.status;

    if (
      status !== "visible" &&
      status !== "hidden" &&
      status !== "banned"
    ) {
      return respErr("invalid status");
    }

    const updated = await setShareStatus(id, status as StoryShareStatus);
    if (!updated) {
      return respErr("not found");
    }

    return respData({ ok: true, status: updated.status });
  } catch (e) {
    console.log("admin update story share failed", e);
    return respErr("update failed");
  }
}
