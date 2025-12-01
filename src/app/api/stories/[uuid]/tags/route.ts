import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  findPublicStoryByUuid,
  findStoryByUuidForUser,
} from "@/models/story";
import { getTagsForStory, setTagsForStory } from "@/models/storyTags";

export async function GET(
  req: Request,
  context: any
) {
  try {
    const uuid = context.params?.uuid;
    if (!uuid) {
      return respErr("invalid params");
    }

    let story = await findPublicStoryByUuid(uuid);
    if (!story) {
      const user_uuid = await getUserUuid();
      if (!user_uuid) {
        return respErr("story not found");
      }

      story = await findStoryByUuidForUser(uuid, user_uuid);
      if (!story) {
        return respErr("story not found");
      }
    }

    const tags = await getTagsForStory(uuid);

    return respData(tags);
  } catch (e) {
    console.log("get story tags failed", e);
    return respErr("get story tags failed");
  }
}

export async function PUT(
  req: Request,
  context: any
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

    const body = await req.json().catch(() => null);
    const tagsInput = Array.isArray(body?.tags) ? (body.tags as unknown[]) : [];

    const rawTags: string[] = [];
    for (const value of tagsInput) {
      if (typeof value === "string") {
        rawTags.push(value);
      }
    }

    const tags = await setTagsForStory(uuid, rawTags);

    return respData(tags);
  } catch (e) {
    console.log("set story tags failed", e);
    return respErr("set story tags failed");
  }
}
