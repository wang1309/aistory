import { respData, respErr, respOk } from "@/lib/resp";
import { resolveModelAlias } from "@/lib/model-alias";
import { getUserUuid } from "@/services/user";
import {
  findStoryByUuidForUser,
  deleteStoryForUser,
  StoryStatus,
  updateStoryForUser,
} from "@/models/story";

export type StoryRouteDependencies = {
  getUserUuid: typeof getUserUuid;
  findStoryByUuidForUser: typeof findStoryByUuidForUser;
  updateStoryForUser: typeof updateStoryForUser;
  deleteStoryForUser: typeof deleteStoryForUser;
};

function getDefaultDependencies(): StoryRouteDependencies {
  return {
    getUserUuid,
    findStoryByUuidForUser,
    updateStoryForUser,
    deleteStoryForUser,
  };
}

export function createGetStoryHandler(
  deps: StoryRouteDependencies = getDefaultDependencies()
) {
  return async function GET(req: Request, context: any) {
    try {
      const user_uuid = await deps.getUserUuid();
      if (!user_uuid) {
        return respErr("no auth");
      }

      const { uuid } = await context.params;
      if (!uuid) {
        return respErr("invalid params");
      }

      const story = await deps.findStoryByUuidForUser(uuid, user_uuid);
      if (!story) {
        return respErr("story not found");
      }

      const { model_used: _, ...safe } = story;
      return respData(safe);
    } catch (e) {
      console.log("get story failed", e);
      return respErr("get story failed");
    }
  };
}

export function createPatchStoryHandler(
  deps: StoryRouteDependencies = getDefaultDependencies()
) {
  return async function PATCH(req: Request, context: any) {
    try {
      const user_uuid = await deps.getUserUuid();
      if (!user_uuid) {
        return respErr("no auth");
      }

      const { uuid } = await context.params;
      if (!uuid) {
        return respErr("invalid params");
      }

      const body = await req.json().catch(() => null);
      const rawStatus = body?.status as string | undefined;
      const title =
        typeof body?.title === "string" ? (body.title as string) : undefined;
      const prompt =
        typeof body?.prompt === "string"
          ? (body.prompt as string)
          : body?.prompt === null
          ? null
          : undefined;
      const content =
        typeof body?.content === "string" ? (body.content as string) : undefined;
      const modelUsed =
        typeof body?.modelUsed === "string"
          ? (body.modelUsed as string)
          : body?.modelUsed === null
          ? null
          : undefined;
      const wordCount =
        typeof body?.wordCount === "number" &&
        Number.isFinite(body.wordCount) &&
        body.wordCount >= 0
          ? (body.wordCount as number)
          : undefined;

      let settings: Record<string, unknown> | null | undefined;
      if (body && "settings" in body) {
        if (
          body.settings !== null &&
          (typeof body.settings !== "object" || Array.isArray(body.settings))
        ) {
          return respErr("invalid params");
        }

        settings = (body.settings ?? null) as Record<string, unknown> | null;
      }

      let status: StoryStatus | undefined;
      if (rawStatus !== undefined) {
        if (
          rawStatus !== "draft" &&
          rawStatus !== "saved" &&
          rawStatus !== "published"
        ) {
          return respErr("invalid params");
        }
        status = rawStatus as StoryStatus;
      }

      if (
        status === undefined &&
        title === undefined &&
        prompt === undefined &&
        content === undefined &&
        wordCount === undefined &&
        modelUsed === undefined &&
        settings === undefined
      ) {
        return respErr("invalid params");
      }

      const updated = await deps.updateStoryForUser(uuid, user_uuid, {
        title,
        prompt,
        content,
        word_count: wordCount,
        model_used: resolveModelAlias(modelUsed),
        settings,
        status,
      });

      if (!updated) {
        return respErr("story not found");
      }

      const { model_used: _, ...safe } = updated;
      return respData(safe);
    } catch (e) {
      console.log("update story failed", e);
      return respErr("update story failed");
    }
  };
}

export function createDeleteStoryHandler(
  deps: StoryRouteDependencies = getDefaultDependencies()
) {
  return async function DELETE(req: Request, context: any) {
    try {
      const user_uuid = await deps.getUserUuid();
      if (!user_uuid) {
        return respErr("no auth");
      }

      const { uuid } = await context.params;
      if (!uuid) {
        return respErr("invalid params");
      }

      const ok = await deps.deleteStoryForUser(uuid, user_uuid);
      if (!ok) {
        return respErr("story not found");
      }

      return respOk();
    } catch (e) {
      console.log("delete story failed", e);
      return respErr("delete story failed");
    }
  };
}
