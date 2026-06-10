import { db } from "@/db";
import { sg_story_bibles } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type BibleCharacter = {
  name: string;
  role: string;
  personality: string;
  backstory: string;
  relationships: string;
};

export async function getBibleForStory(storyUuid: string) {
  const [bible] = await db()
    .select()
    .from(sg_story_bibles)
    .where(eq(sg_story_bibles.story_uuid, storyUuid));
  return bible;
}

export async function getBibleByUuid(uuid: string, userUuid: string) {
  const [bible] = await db()
    .select()
    .from(sg_story_bibles)
    .where(
      and(eq(sg_story_bibles.uuid, uuid), eq(sg_story_bibles.user_uuid, userUuid))
    );
  return bible;
}

export async function insertBible(
  data: typeof sg_story_bibles.$inferInsert
) {
  const [bible] = await db().insert(sg_story_bibles).values(data).returning();
  return bible;
}

export async function updateBibleForStory(
  storyUuid: string,
  userUuid: string,
  data: {
    characters?: BibleCharacter[];
    world_lore?: string;
    style_note?: string;
  }
) {
  const [bible] = await db()
    .update(sg_story_bibles)
    .set({ ...data, updated_at: new Date() })
    .where(
      and(
        eq(sg_story_bibles.story_uuid, storyUuid),
        eq(sg_story_bibles.user_uuid, userUuid)
      )
    )
    .returning();
  return bible;
}

export async function updateBibleByUuid(
  uuid: string,
  userUuid: string,
  data: {
    characters?: BibleCharacter[];
    world_lore?: string;
    style_note?: string;
  }
) {
  const [bible] = await db()
    .update(sg_story_bibles)
    .set({ ...data, updated_at: new Date() })
    .where(
      and(
        eq(sg_story_bibles.uuid, uuid),
        eq(sg_story_bibles.user_uuid, userUuid)
      )
    )
    .returning();
  return bible;
}

export async function deleteBibleForStory(storyUuid: string, userUuid: string) {
  const [bible] = await db()
    .delete(sg_story_bibles)
    .where(
      and(
        eq(sg_story_bibles.story_uuid, storyUuid),
        eq(sg_story_bibles.user_uuid, userUuid)
      )
    )
    .returning();
  return bible;
}

export { formatBibleForPrompt } from "@/lib/bible-format";
