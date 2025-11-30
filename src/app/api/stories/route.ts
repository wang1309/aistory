import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  insertStory,
  getStoriesByUser,
  StoryStatus,
  StoryVisibility,
} from "@/models/story";
import { getUuid } from "@/lib/hash";
import { updateUserStatsOnStoryCreated } from "@/models/userStats";

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const pageSizeParam = url.searchParams.get("pageSize");
    const statusParam = url.searchParams.get("status");
    const visibilityParam = url.searchParams.get("visibility");

    const page = pageParam ? parseInt(pageParam, 10) || 1 : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) || 20 : 20;

    let status: StoryStatus | undefined;
    if (statusParam === "draft" || statusParam === "saved" || statusParam === "published") {
      status = statusParam;
    }

    let visibility: StoryVisibility | undefined;
    if (
      visibilityParam === "private" ||
      visibilityParam === "public" ||
      visibilityParam === "followers"
    ) {
      visibility = visibilityParam;
    }

    const { items, total } = await getStoriesByUser({
      user_uuid,
      page,
      limit: pageSize,
      status,
      visibility,
    });

    const summaries = items.map((item) => ({
      uuid: item.uuid,
      title: item.title,
      word_count: item.word_count,
      status: item.status,
      visibility: item.visibility,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

    return respData({
      items: summaries,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (e) {
    console.log("get stories failed", e);
    return respErr("get stories failed");
  }
}

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const body = await req.json();
    const {
      title,
      prompt,
      content,
      wordCount,
      modelUsed,
      settings,
      status,
      visibility,
      sourceCategory,
    } = body || {};

    if (!content || typeof content !== "string") {
      return respErr("invalid params");
    }

    const normalizedWordCount =
      typeof wordCount === "number" && wordCount > 0
        ? wordCount
        : content.trim().length > 0
        ? content.trim().split(/\s+/).length
        : 0;

    let storyStatus: StoryStatus = "saved";
    if (status === "draft" || status === "saved" || status === "published") {
      storyStatus = status;
    }

    let storyVisibility: StoryVisibility = "private";
    if (visibility === "private" || visibility === "public" || visibility === "followers") {
      storyVisibility = visibility;
    }

    let sourceCategoryValue: string | null = null;
    if (
      typeof sourceCategory === "string" &&
      (sourceCategory === "story" ||
        sourceCategory === "title" ||
        sourceCategory === "fanfic" ||
        sourceCategory === "plot" ||
        sourceCategory === "poem")
    ) {
      sourceCategoryValue = sourceCategory;
    }

    const now = new Date();

    const newStory = await insertStory({
      uuid: getUuid(),
      user_uuid,
      title: typeof title === "string" ? title : null,
      prompt: typeof prompt === "string" ? prompt : null,
      content,
      word_count: normalizedWordCount,
      model_used: typeof modelUsed === "string" ? modelUsed : null,
      settings: settings ?? null,
      status: storyStatus,
      visibility: storyVisibility,
      source_category: sourceCategoryValue,
      created_at: now,
      updated_at: now,
    });

    if (!newStory) {
      return respErr("create story failed");
    }

    try {
      await updateUserStatsOnStoryCreated({
        user_uuid,
        wordCount: normalizedWordCount,
        createdAt: now,
      });
    } catch (e) {
      console.log("update user stats failed", e);
    }

    return respData(newStory);
  } catch (e) {
    console.log("create story failed", e);
    return respErr("create story failed");
  }
}
