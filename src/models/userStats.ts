import { db } from "@/db";
import { sg_user_stats } from "@/db/schema";
import { eq } from "drizzle-orm";

interface UpdateUserStatsOnStoryCreatedParams {
  user_uuid: string;
  wordCount: number;
  createdAt?: Date;
}

function startOfUtcDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function diffDays(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const startA = startOfUtcDate(a);
  const startB = startOfUtcDate(b);
  return Math.round((startB.getTime() - startA.getTime()) / msPerDay);
}

function parseDateStringToUtcDate(value: string): Date {
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  return new Date(Date.UTC(year, month - 1, day));
}

export async function updateUserStatsOnStoryCreated(
  params: UpdateUserStatsOnStoryCreatedParams
): Promise<void> {
  const now = params.createdAt ?? new Date();
  const today = startOfUtcDate(now);
  const todayString = today.toISOString().slice(0, 10);

  const [stats] = await db()
    .select()
    .from(sg_user_stats)
    .where(eq(sg_user_stats.user_uuid, params.user_uuid))
    .limit(1);

  const existingTotalStories = stats?.total_stories ?? 0;
  const existingTotalWords = stats?.total_words ?? 0;
  const existingCreationDays = stats?.creation_days ?? 0;
  const existingCurrentStreak = stats?.current_streak ?? 0;
  const existingLongestStreak = stats?.longest_streak ?? 0;
  const lastDateString = stats?.last_creation_date ?? null;

  let totalStories = existingTotalStories + 1;
  const additionalWords = params.wordCount > 0 ? params.wordCount : 0;
  let totalWords = existingTotalWords + additionalWords;
  let creationDays = existingCreationDays;
  let currentStreak = 1;
  let longestStreak = existingLongestStreak;

  if (lastDateString) {
    const lastDate = parseDateStringToUtcDate(lastDateString);
    const diff = diffDays(lastDate, today);

    if (diff <= 0) {
      creationDays = existingCreationDays > 0 ? existingCreationDays : 1;
      currentStreak = existingCurrentStreak > 0 ? existingCurrentStreak : 1;
    } else {
      creationDays = existingCreationDays + 1;

      if (diff === 1) {
        const baseCurrent = existingCurrentStreak > 0 ? existingCurrentStreak : 1;
        currentStreak = baseCurrent + 1;
      } else {
        currentStreak = 1;
      }
    }
  } else {
    creationDays = existingCreationDays + 1;
    currentStreak = 1;
  }

  if (creationDays <= 0) {
    creationDays = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }
  if (longestStreak <= 0) {
    longestStreak = currentStreak > 0 ? currentStreak : 1;
  }

  await db()
    .insert(sg_user_stats)
    .values({
      user_uuid: params.user_uuid,
      total_stories: totalStories,
      total_words: totalWords,
      creation_days: creationDays,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_creation_date: todayString,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: sg_user_stats.user_uuid,
      set: {
        total_stories: totalStories,
        total_words: totalWords,
        creation_days: creationDays,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_creation_date: todayString,
        updated_at: now,
      },
    });
}

export async function getUserStats(user_uuid: string) {
  const [stats] = await db()
    .select()
    .from(sg_user_stats)
    .where(eq(sg_user_stats.user_uuid, user_uuid))
    .limit(1);

  if (stats) {
    return stats;
  }

  return {
    user_uuid,
    total_stories: 0,
    total_words: 0,
    creation_days: 0,
    longest_streak: 0,
    current_streak: 0,
    last_creation_date: null,
    updated_at: null,
  };
}
