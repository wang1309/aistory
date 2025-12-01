import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findPublicStoryByUuid } from "@/models/story";
import {
  getStoryLikesCount,
  isStoryLikedByUser,
  likeStory,
  unlikeStory,
} from "@/models/storyInteraction";

export async function GET(
  req: Request,
  context: any
) {
  try {
    const uuid = context.params?.uuid;
    if (!uuid) {
      return respErr("invalid params");
    }

    const story = await findPublicStoryByUuid(uuid);
    if (!story) {
      return respErr("story not found");
    }

    const likesCount = await getStoryLikesCount(uuid);

    let liked = false;
    try {
      const user_uuid = await getUserUuid();
      if (user_uuid) {
        liked = await isStoryLikedByUser(uuid, user_uuid);
      }
    } catch (e) {
      console.log("get story likes user failed", e);
    }

    return respData({ liked, likesCount });
  } catch (e) {
    console.log("get story likes failed", e);
    return respErr("get story likes failed");
  }
}

export async function POST(
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

    const story = await findPublicStoryByUuid(uuid);
    if (!story) {
      return respErr("story not found");
    }

    const result = await likeStory(uuid, user_uuid);

    return respData(result);
  } catch (e) {
    console.log("like story failed", e);
    return respErr("like story failed");
  }
}

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
    if (!uuid) {
      return respErr("invalid params");
    }

    const story = await findPublicStoryByUuid(uuid);
    if (!story) {
      return respErr("story not found");
    }

    const result = await unlikeStory(uuid, user_uuid);

    return respData(result);
  } catch (e) {
    console.log("unlike story failed", e);
    return respErr("unlike story failed");
  }
}
