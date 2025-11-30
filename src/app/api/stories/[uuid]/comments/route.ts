import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findPublicStoryByUuid } from "@/models/story";
import {
  createStoryComment,
  getStoryComments,
} from "@/models/storyInteraction";

export async function GET(
  req: Request,
  context: { params: { uuid: string } }
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

    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const pageSizeParam = url.searchParams.get("pageSize");

    const page = pageParam ? parseInt(pageParam, 10) || 1 : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) || 20 : 20;

    const { items, total } = await getStoryComments({
      story_uuid: uuid,
      page,
      limit: pageSize,
    });

    const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

    return respData({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (e) {
    console.log("get story comments failed", e);
    return respErr("get story comments failed");
  }
}

export async function POST(
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

    const story = await findPublicStoryByUuid(uuid);
    if (!story) {
      return respErr("story not found");
    }

    const body = await req.json().catch(() => null);
    const rawContent = typeof body?.content === "string" ? body.content : "";
    const content = rawContent.trim();

    if (!content) {
      return respErr("invalid params");
    }

    if (content.length > 500) {
      return respErr("comment too long");
    }

    let parentId: number | undefined = undefined;
    if (typeof body?.parentId === "number" && body.parentId > 0) {
      parentId = body.parentId;
    }

    const comment = await createStoryComment({
      story_uuid: uuid,
      user_uuid,
      content,
      parentId,
    });

    if (!comment) {
      return respErr("create comment failed");
    }

    return respData(comment);
  } catch (e) {
    console.log("create story comment failed", e);
    return respErr("create story comment failed");
  }
}
