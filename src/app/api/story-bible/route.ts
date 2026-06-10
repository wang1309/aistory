import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getUuid } from "@/lib/hash";
import {
  insertBible,
  type BibleCharacter,
} from "@/models/story-bible";

// GET /api/story-bible?story=xxx
export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const story_uuid = new URL(req.url).searchParams.get("story");
    if (!story_uuid) {
      return respErr("story is required");
    }

    const { getBibleForStory } = await import("@/models/story-bible");
    const bible = await getBibleForStory(story_uuid);
    return respData(bible || null);
  } catch (e: any) {
    return respErr(e.message || "failed to fetch bible");
  }
}

// POST — create bible for a story
export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const body = await req.json();
    const { story_uuid, characters, world_lore, style_note } = body as {
      story_uuid?: string;
      characters?: BibleCharacter[];
      world_lore?: string;
      style_note?: string;
    };

    if (!story_uuid) {
      return respErr("story_uuid is required");
    }

    const bible = await insertBible({
      uuid: getUuid(),
      story_uuid,
      user_uuid,
      characters: characters || [],
      world_lore: world_lore || null,
      style_note: style_note || null,
    });

    return respData(bible);
  } catch (e: any) {
    return respErr(e.message || "failed to create bible");
  }
}
