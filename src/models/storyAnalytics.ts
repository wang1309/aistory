import { db } from "@/db";
import { sg_stories } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export interface DailyStoryStat {
  date: string; // YYYY-MM-DD
  story_count: number;
  total_words: number;
}

interface GetDailyStoryStatsByUserOptions {
  user_uuid: string;
  days?: number; // 默认 30 天
}

export async function getDailyStoryStatsByUser(
  options: GetDailyStoryStatsByUserOptions
): Promise<DailyStoryStat[]> {
  const days = options.days && options.days > 0 ? options.days : 30;
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const rows = await db()
    .select({
      date: sql<string>`to_char(date_trunc('day', ${sg_stories.created_at}), 'YYYY-MM-DD')`,
      story_count: sql<number>`cast(count(*) as int)` ,
      total_words: sql<number>`coalesce(sum(${sg_stories.word_count}), 0)` ,
    })
    .from(sg_stories)
    .where(
      and(
        eq(sg_stories.user_uuid, options.user_uuid),
        gte(sg_stories.created_at, from)
      )
    )
    .groupBy(sql`date_trunc('day', ${sg_stories.created_at})`)
    .orderBy(sql`date_trunc('day', ${sg_stories.created_at})`);

  return rows.map((row) => ({
    date: row.date,
    story_count: row.story_count ?? 0,
    total_words: row.total_words ?? 0,
  }));
}
