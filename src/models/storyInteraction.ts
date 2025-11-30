import { db } from "@/db";
import { sg_story_likes, sg_story_comments } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function getStoryLikesCount(
  story_uuid: string
): Promise<number> {
  const [row] = await db()
    .select({ value: sql<number>`cast(count(*) as int)` })
    .from(sg_story_likes)
    .where(eq(sg_story_likes.story_uuid, story_uuid));

  return row?.value ?? 0;
}

export async function isStoryLikedByUser(
  story_uuid: string,
  user_uuid: string
): Promise<boolean> {
  const [row] = await db()
    .select({ id: sg_story_likes.id })
    .from(sg_story_likes)
    .where(
      and(
        eq(sg_story_likes.story_uuid, story_uuid),
        eq(sg_story_likes.user_uuid, user_uuid)
      )
    )
    .limit(1);

  return !!row;
}

export async function likeStory(
  story_uuid: string,
  user_uuid: string
): Promise<{ liked: boolean; likesCount: number }> {
  const alreadyLiked = await isStoryLikedByUser(story_uuid, user_uuid);

  if (!alreadyLiked) {
    await db().insert(sg_story_likes).values({
      story_uuid,
      user_uuid,
      created_at: new Date(),
    });
  }

  const likesCount = await getStoryLikesCount(story_uuid);

  return { liked: true, likesCount };
}

export async function unlikeStory(
  story_uuid: string,
  user_uuid: string
): Promise<{ liked: boolean; likesCount: number }> {
  await db()
    .delete(sg_story_likes)
    .where(
      and(
        eq(sg_story_likes.story_uuid, story_uuid),
        eq(sg_story_likes.user_uuid, user_uuid)
      )
    );

  const likesCount = await getStoryLikesCount(story_uuid);

  return { liked: false, likesCount };
}

interface CreateStoryCommentInput {
  story_uuid: string;
  user_uuid: string;
  content: string;
  parentId?: number;
}

export async function createStoryComment(
  input: CreateStoryCommentInput
): Promise<typeof sg_story_comments.$inferSelect | undefined> {
  const now = new Date();

  if (!input.parentId) {
    const [inserted] = await db()
      .insert(sg_story_comments)
      .values({
        story_uuid: input.story_uuid,
        user_uuid: input.user_uuid,
        content: input.content,
        parent_id: null,
        root_id: null,
        is_deleted: false,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      })
      .returning();

    if (!inserted) {
      return undefined;
    }

    const [updated] = await db()
      .update(sg_story_comments)
      .set({
        root_id: inserted.id,
        updated_at: now,
      })
      .where(eq(sg_story_comments.id, inserted.id))
      .returning();

    return updated ?? inserted;
  }

  const [parent] = await db()
    .select()
    .from(sg_story_comments)
    .where(
      and(
        eq(sg_story_comments.id, input.parentId),
        eq(sg_story_comments.story_uuid, input.story_uuid)
      )
    )
    .limit(1);

  if (!parent) {
    return undefined;
  }

  const rootId = parent.root_id ?? parent.id;

  const [comment] = await db()
    .insert(sg_story_comments)
    .values({
      story_uuid: input.story_uuid,
      user_uuid: input.user_uuid,
      content: input.content,
      parent_id: parent.id,
      root_id: rootId,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    })
    .returning();

  return comment;
}

interface GetStoryCommentsOptions {
  story_uuid: string;
  page?: number;
  limit?: number;
}

export async function getStoryComments(
  options: GetStoryCommentsOptions
): Promise<{
  items: typeof sg_story_comments.$inferSelect[];
  total: number;
}> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const offset = (page - 1) * limit;

  const where = eq(sg_story_comments.story_uuid, options.story_uuid);

  const items = await db()
    .select()
    .from(sg_story_comments)
    .where(where)
    .orderBy(sg_story_comments.created_at)
    .limit(limit)
    .offset(offset);

  const [countRow] = await db()
    .select({ value: sql<number>`cast(count(*) as int)` })
    .from(sg_story_comments)
    .where(where);

  const total = countRow?.value ?? 0;

  return { items, total };
}

export async function softDeleteStoryComment(
  commentId: number,
  user_uuid: string,
  story_uuid: string
): Promise<boolean> {
  const now = new Date();

  const rows = await db()
    .update(sg_story_comments)
    .set({
      is_deleted: true,
      deleted_at: now,
      updated_at: now,
    })
    .where(
      and(
        eq(sg_story_comments.id, commentId),
        eq(sg_story_comments.user_uuid, user_uuid),
        eq(sg_story_comments.story_uuid, story_uuid)
      )
    )
    .returning({ id: sg_story_comments.id });

  return rows.length > 0;
}
