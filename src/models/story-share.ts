import { db } from "@/db";
import { sg_story_shares, feedbacks } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export type StoryShareStatus = "visible" | "hidden" | "banned";

export async function insertShare(
  data: typeof sg_story_shares.$inferInsert
): Promise<typeof sg_story_shares.$inferSelect | undefined> {
  const [row] = await db().insert(sg_story_shares).values(data).returning();
  return row;
}

export async function findShareByShareId(
  share_id: string
): Promise<typeof sg_story_shares.$inferSelect | undefined> {
  const [row] = await db()
    .select()
    .from(sg_story_shares)
    .where(eq(sg_story_shares.share_id, share_id))
    .limit(1);

  return row;
}

export async function findVisibleShareByShareId(
  share_id: string
): Promise<typeof sg_story_shares.$inferSelect | undefined> {
  const [row] = await db()
    .select()
    .from(sg_story_shares)
    .where(
      and(
        eq(sg_story_shares.share_id, share_id),
        eq(sg_story_shares.status, "visible")
      )
    )
    .limit(1);

  return row;
}

export async function incrShareView(share_id: string): Promise<void> {
  await db()
    .update(sg_story_shares)
    .set({ view_count: sql`${sg_story_shares.view_count} + 1` })
    .where(eq(sg_story_shares.share_id, share_id));
}

/**
 * Soft-delete by delete_token (anonymous creator). Returns true if a row was
 * affected. The record stays in the table (status=hidden) for audit.
 */
export async function hideShareByToken(
  share_id: string,
  delete_token: string
): Promise<boolean> {
  const rows = await db()
    .update(sg_story_shares)
    .set({ status: "hidden", updated_at: new Date() })
    .where(
      and(
        eq(sg_story_shares.share_id, share_id),
        eq(sg_story_shares.delete_token, delete_token)
      )
    )
    .returning({ id: sg_story_shares.id });

  return rows.length > 0;
}

/** Soft-delete by owner (logged-in creator). */
export async function hideShareForUser(
  share_id: string,
  user_uuid: string
): Promise<boolean> {
  const rows = await db()
    .update(sg_story_shares)
    .set({ status: "hidden", updated_at: new Date() })
    .where(
      and(
        eq(sg_story_shares.share_id, share_id),
        eq(sg_story_shares.user_uuid, user_uuid)
      )
    )
    .returning({ id: sg_story_shares.id });

  return rows.length > 0;
}

/** Admin takedown / restore. */
export async function setShareStatus(
  share_id: string,
  status: StoryShareStatus
): Promise<typeof sg_story_shares.$inferSelect | undefined> {
  const [row] = await db()
    .update(sg_story_shares)
    .set({ status, updated_at: new Date() })
    .where(eq(sg_story_shares.share_id, share_id))
    .returning();

  return row;
}

interface GetSharesByUserOptions {
  user_uuid: string;
  page?: number;
  limit?: number;
}

export async function getSharesByUser(
  options: GetSharesByUserOptions
): Promise<{ items: typeof sg_story_shares.$inferSelect[]; total: number }> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const offset = (page - 1) * limit;

  const items = await db()
    .select()
    .from(sg_story_shares)
    .where(eq(sg_story_shares.user_uuid, options.user_uuid))
    .orderBy(desc(sg_story_shares.created_at))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db()
    .select({ value: sql<number>`cast(count(*) as int)` })
    .from(sg_story_shares)
    .where(eq(sg_story_shares.user_uuid, options.user_uuid));

  return { items, total: countRow?.value ?? 0 };
}

export interface AdminShareRow {
  share_id: string;
  title: string | null;
  status: string;
  view_count: number;
  user_uuid: string | null;
  created_at: Date | null;
  report_count: number;
}

/**
 * Admin listing of story shares, with a correlated count of pending reports
 * (sg_feedbacks rows with status='report' and content prefixed `share:<id> |`).
 */
export async function getSharesForAdmin(options: {
  page?: number;
  limit?: number;
  onlyReported?: boolean;
}): Promise<{ items: AdminShareRow[]; total: number }> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 50;
  const offset = (page - 1) * limit;

  const reportCountExpr = sql<number>`(
    select count(*)::int from ${feedbacks}
    where ${feedbacks.status} = 'report'
      and ${feedbacks.content} like 'share:' || ${sg_story_shares.share_id} || ' |%'
  )`;

  const where = options.onlyReported ? sql`${reportCountExpr} > 0` : undefined;

  const items = await db()
    .select({
      share_id: sg_story_shares.share_id,
      title: sg_story_shares.title,
      status: sg_story_shares.status,
      view_count: sg_story_shares.view_count,
      user_uuid: sg_story_shares.user_uuid,
      created_at: sg_story_shares.created_at,
      report_count: reportCountExpr.as("report_count"),
    })
    .from(sg_story_shares)
    .where(where)
    .orderBy(desc(sg_story_shares.created_at))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db()
    .select({ value: sql<number>`cast(count(*) as int)` })
    .from(sg_story_shares)
    .where(where);

  return { items, total: countRow?.value ?? 0 };
}

/**
 * Count of shares that have at least one pending report (status='report').
 * Lightweight enough for the admin dashboard card.
 */
export async function getReportedSharesCount(): Promise<number> {
  const hasReport = sql`exists(
    select 1 from ${feedbacks}
    where ${feedbacks.status} = 'report'
      and ${feedbacks.content} like 'share:' || ${sg_story_shares.share_id} || ' |%'
  )`;

  const [row] = await db()
    .select({ value: sql<number>`cast(count(*) as int)` })
    .from(sg_story_shares)
    .where(hasReport);

  return row?.value ?? 0;
}
