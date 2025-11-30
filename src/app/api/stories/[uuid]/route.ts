import { respData, respErr, respOk } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  findStoryByUuidForUser,
  updateStoryStatusForUser,
  updateStoryTitleForUser,
  deleteStoryForUser,
  StoryStatus,
} from "@/models/story";

export async function GET(
  req: Request,
  context: { params: { uuid: string } }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const uuid = context.params?.uuid;
    if (!uuid) {
      return respErr("invalid params");
    }

    const story = await findStoryByUuidForUser(uuid, user_uuid);
    if (!story) {
      return respErr("story not found");
    }

    return respData(story);
  } catch (e) {
    console.log("get story failed", e);
    return respErr("get story failed");
  }
}

export async function PATCH(
  req: Request,
  context: { params: { uuid: string } }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const uuid = context.params?.uuid;
    if (!uuid) {
      return respErr("invalid params");
    }

    const body = await req.json().catch(() => null);
    const rawStatus = body?.status as string | undefined;
    const title =
      typeof body?.title === "string" ? (body.title as string) : undefined;

    let status: StoryStatus | undefined;
    if (rawStatus !== undefined) {
      if (rawStatus !== "draft" && rawStatus !== "saved" && rawStatus !== "published") {
        return respErr("invalid params");
      }
      status = rawStatus as StoryStatus;
    }

    if (!status && title === undefined) {
      return respErr("invalid params");
    }

    let updated;
    if (status) {
      updated = await updateStoryStatusForUser(uuid, user_uuid, status);
    } else if (title !== undefined) {
      updated = await updateStoryTitleForUser(uuid, user_uuid, title);
    }

    if (!updated) {
      return respErr("story not found");
    }

    return respData(updated);
  } catch (e) {
    console.log("update story status failed", e);
    return respErr("update story status failed");
  }
}

export async function DELETE(
  req: Request,
  context: { params: { uuid: string } }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const uuid = context.params?.uuid;
    if (!uuid) {
      return respErr("invalid params");
    }

    const ok = await deleteStoryForUser(uuid, user_uuid);
    if (!ok) {
      return respErr("story not found");
    }

    return respOk();
  } catch (e) {
    console.log("delete story failed", e);
    return respErr("delete story failed");
  }
}
