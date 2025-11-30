import { db } from "@/db";
import {
  sg_stories,
  sg_story_tag_relations,
  sg_tags,
} from "@/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

interface NormalizedTag {
  slug: string;
  name: string;
}

function normalizeTagValue(value: string): NormalizedTag | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const limitedName = trimmed.slice(0, 32);

  const base = limitedName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "");

  const slugSource = base || limitedName.toLowerCase();
  const slug = slugSource.slice(0, 64);

  if (!slug) {
    return null;
  }

  return {
    slug,
    name: limitedName,
  };
}

export function normalizeTags(
  rawTags: string[],
  maxCount: number = 5
): NormalizedTag[] {
  const seen = new Set<string>();
  const result: NormalizedTag[] = [];

  for (const raw of rawTags) {
    if (result.length >= maxCount) {
      break;
    }

    if (typeof raw !== "string") {
      continue;
    }

    const normalized = normalizeTagValue(raw);
    if (!normalized) {
      continue;
    }

    if (seen.has(normalized.slug)) {
      continue;
    }

    seen.add(normalized.slug);
    result.push(normalized);
  }

  return result;
}

export async function getTagsForStory(story_uuid: string) {
  const rows = await db()
    .select({
      id: sg_tags.id,
      slug: sg_tags.slug,
      name: sg_tags.name,
    })
    .from(sg_story_tag_relations)
    .innerJoin(sg_tags, eq(sg_story_tag_relations.tag_id, sg_tags.id))
    .where(eq(sg_story_tag_relations.story_uuid, story_uuid))
    .orderBy(asc(sg_tags.name));

  return rows;
}

export async function setTagsForStory(
  story_uuid: string,
  rawTags: string[]
): Promise<
  { id: number; slug: string; name: string }[]
> {
  const normalized = normalizeTags(rawTags);

  if (normalized.length === 0) {
    await db()
      .delete(sg_story_tag_relations)
      .where(eq(sg_story_tag_relations.story_uuid, story_uuid));

    return [];
  }

  const slugs = normalized.map((item) => item.slug);

  const existing = await db()
    .select()
    .from(sg_tags)
    .where(inArray(sg_tags.slug, slugs));

  const existingBySlug = new Map(existing.map((tag) => [tag.slug, tag]));

  const toInsert = normalized.filter((item) => !existingBySlug.has(item.slug));

  let inserted: typeof sg_tags.$inferSelect[] = [];
  if (toInsert.length > 0) {
    inserted = await db()
      .insert(sg_tags)
      .values(
        toInsert.map((item) => ({
          slug: item.slug,
          name: item.name,
          created_at: new Date(),
        }))
      )
      .returning();
  }

  const allTags = [...existing, ...inserted];

  await db()
    .delete(sg_story_tag_relations)
    .where(eq(sg_story_tag_relations.story_uuid, story_uuid));

  if (allTags.length > 0) {
    await db()
      .insert(sg_story_tag_relations)
      .values(
        allTags.map((tag) => ({
          story_uuid,
          tag_id: tag.id,
          created_at: new Date(),
        }))
      );
  }

  const sorted = [...allTags].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  return sorted.map((tag) => ({
    id: tag.id,
    slug: tag.slug,
    name: tag.name,
  }));
}

export async function getPopularTags(limit: number = 20) {
  const safeLimit = !limit || limit <= 0 ? 20 : Math.min(limit, 100);

  const rows = await db()
    .select({
      id: sg_tags.id,
      slug: sg_tags.slug,
      name: sg_tags.name,
      storyCount: sql<number>`cast(count(${sg_story_tag_relations.story_uuid}) as int)`,
    })
    .from(sg_story_tag_relations)
    .innerJoin(
      sg_stories,
      eq(sg_story_tag_relations.story_uuid, sg_stories.uuid)
    )
    .innerJoin(sg_tags, eq(sg_story_tag_relations.tag_id, sg_tags.id))
    .where(
      and(
        eq(sg_stories.status, "published"),
        eq(sg_stories.visibility, "public")
      )
    )
    .groupBy(sg_tags.id, sg_tags.slug, sg_tags.name)
    .orderBy(
      desc(sql`count(${sg_story_tag_relations.story_uuid})`),
      asc(sg_tags.name)
    )
    .limit(safeLimit);

  return rows;
}
