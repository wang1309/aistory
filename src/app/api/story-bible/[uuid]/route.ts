import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  getBibleByUuid,
  updateBibleByUuid,
  deleteBibleForStory,
  type BibleCharacter,
} from "@/models/story-bible";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const { uuid } = await params;
    const bible = await getBibleByUuid(uuid, user_uuid);
    if (!bible) {
      return respErr("not found");
    }

    return respData(bible);
  } catch (e: any) {
    return respErr(e.message || "failed to fetch bible");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const { uuid } = await params;
    const body = await req.json();
    const { characters, world_lore, style_note } = body as {
      characters?: BibleCharacter[];
      world_lore?: string;
      style_note?: string;
    };

    const bible = await updateBibleByUuid(uuid, user_uuid, {
      characters,
      world_lore,
      style_note,
    });

    if (!bible) {
      return respErr("not found");
    }

    return respData(bible);
  } catch (e: any) {
    return respErr(e.message || "failed to update bible");
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const { uuid } = await params;
    // fetch first to get story_uuid
    const bible = await getBibleByUuid(uuid, user_uuid);
    if (!bible) {
      return respErr("not found");
    }

    await deleteBibleForStory(bible.story_uuid, user_uuid);
    return respData({ ok: true });
  } catch (e: any) {
    return respErr(e.message || "failed to delete bible");
  }
}
