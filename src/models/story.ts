import { db } from "@/db";
import { sg_stories, sg_story_tag_relations, sg_tags } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export type StoryStatus = "draft" | "saved" | "published";

export type StoryVisibility = "private" | "public" | "followers";

export async function insertStory(
  data: typeof sg_stories.$inferInsert
): Promise<typeof sg_stories.$inferSelect | undefined> {
  const [story] = await db().insert(sg_stories).values(data).returning();

  return story;
}

export async function updateStoryTitleForUser(
  uuid: string,
  user_uuid: string,
  title: string
): Promise<typeof sg_stories.$inferSelect | undefined> {
  const [story] = await db()
    .update(sg_stories)
    .set({
      title,
      updated_at: new Date(),
    })
    .where(and(eq(sg_stories.uuid, uuid), eq(sg_stories.user_uuid, user_uuid)))
    .returning();

  return story;
}

export async function deleteStoryForUser(
  uuid: string,
  user_uuid: string
): Promise<boolean> {
  const rows = await db()
    .delete(sg_stories)
    .where(and(eq(sg_stories.uuid, uuid), eq(sg_stories.user_uuid, user_uuid)))
    .returning({ id: sg_stories.id });

  return rows.length > 0;
}

export async function updateStoryStatusForUser(
  uuid: string,
  user_uuid: string,
  status: StoryStatus
): Promise<typeof sg_stories.$inferSelect | undefined> {
  const visibility: StoryVisibility =
    status === "published" ? "public" : "private";

  const [story] = await db()
    .update(sg_stories)
    .set({
      status,
      visibility,
      updated_at: new Date(),
    })
    .where(and(eq(sg_stories.uuid, uuid), eq(sg_stories.user_uuid, user_uuid)))
    .returning();

  return story;
}

interface GetStoriesByUserOptions {
  user_uuid: string;
  page?: number;
  limit?: number;
  status?: StoryStatus;
  visibility?: StoryVisibility;
}

export async function getStoriesByUser(
  options: GetStoriesByUserOptions
): Promise<{ items: typeof sg_stories.$inferSelect[]; total: number }> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const offset = (page - 1) * limit;

  const baseCondition = eq(sg_stories.user_uuid, options.user_uuid);

  let where;
  if (options.status && options.visibility) {
    where = and(
      baseCondition,
      eq(sg_stories.status, options.status),
      eq(sg_stories.visibility, options.visibility)
    );
  } else if (options.status) {
    where = and(baseCondition, eq(sg_stories.status, options.status));
  } else if (options.visibility) {
    where = and(baseCondition, eq(sg_stories.visibility, options.visibility));
  } else {
    where = baseCondition;
  }

  const items = await db()
    .select()
    .from(sg_stories)
    .where(where)
    .orderBy(desc(sg_stories.created_at))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db()
    .select({ value: sql<number>`cast(count(*) as int)` })
    .from(sg_stories)
    .where(where);

  const total = countRow?.value ?? 0;

  return { items, total };
}

export async function findPublicStoryByUuid(
  uuid: string
): Promise<typeof sg_stories.$inferSelect | undefined> {
  const [story] = await db()
    .select()
    .from(sg_stories)
    .where(
      and(
        eq(sg_stories.uuid, uuid),
        eq(sg_stories.status, "published"),
        eq(sg_stories.visibility, "public")
      )
    )
    .limit(1);

  return story;
}

interface GetPublicStoriesOptions {
  page?: number;
  limit?: number;
  tagSlug?: string;
}

export async function getPublicStories(
  options: GetPublicStoriesOptions
): Promise<{ items: typeof sg_stories.$inferSelect[]; total: number }> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const offset = (page - 1) * limit;

  const baseWhere = and(
    eq(sg_stories.status, "published"),
    eq(sg_stories.visibility, "public")
  );

  if (options.tagSlug) {
    const tagSlug = options.tagSlug;

    const where = and(baseWhere, eq(sg_tags.slug, tagSlug));

    const rows = await db()
      .select({
        story: sg_stories,
      })
      .from(sg_stories)
      .innerJoin(
        sg_story_tag_relations,
        eq(sg_story_tag_relations.story_uuid, sg_stories.uuid)
      )
      .innerJoin(sg_tags, eq(sg_story_tag_relations.tag_id, sg_tags.id))
      .where(where)
      .orderBy(desc(sg_stories.created_at))
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) => row.story);

    const [countRow] = await db()
      .select({ value: sql<number>`cast(count(*) as int)` })
      .from(sg_stories)
      .innerJoin(
        sg_story_tag_relations,
        eq(sg_story_tag_relations.story_uuid, sg_stories.uuid)
      )
      .innerJoin(sg_tags, eq(sg_story_tag_relations.tag_id, sg_tags.id))
      .where(where);

    const total = countRow?.value ?? 0;

    return { items, total };
  }

  const where = baseWhere;

  const items = await db()
    .select()
    .from(sg_stories)
    .where(where)
    .orderBy(desc(sg_stories.created_at))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db()
    .select({ value: sql<number>`cast(count(*) as int)` })
    .from(sg_stories)
    .where(where);

  const total = countRow?.value ?? 0;

  return { items, total };
}

export async function findStoryByUuidForUser(
  uuid: string,
  user_uuid: string
): Promise<typeof sg_stories.$inferSelect | undefined> {
  const [story] = await db()
    .select()
    .from(sg_stories)
    .where(and(eq(sg_stories.uuid, uuid), eq(sg_stories.user_uuid, user_uuid)))
    .limit(1);

  return story;
}

