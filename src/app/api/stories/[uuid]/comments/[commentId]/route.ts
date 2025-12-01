import { respErr, respOk } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findPublicStoryByUuid } from "@/models/story";
import { softDeleteStoryComment } from "@/models/storyInteraction";

export async function DELETE(
  req: Request,
  context: any
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const uuid = context.params?.uuid;
    const commentIdParam = context.params?.commentId;

    if (!uuid || !commentIdParam) {
      return respErr("invalid params");
    }

    const commentId = parseInt(commentIdParam, 10);
    if (!commentId || commentId <= 0) {
      return respErr("invalid params");
    }

    const story = await findPublicStoryByUuid(uuid);
    if (!story) {
      return respErr("story not found");
    }

    const ok = await softDeleteStoryComment(commentId, user_uuid, uuid);
    if (!ok) {
      return respErr("comment not found");
    }

    return respOk();
  } catch (e) {
    console.log("delete story comment failed", e);
    return respErr("delete story comment failed");
  }
}
