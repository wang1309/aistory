import type {
  GeneratedStoryOutline,
  StoryOutlineChapterPlan,
  StoryOutlineExpandRequest,
} from "@/types/story-outline";

export const STORY_OUTLINE_EXPAND_CREDIT_COST = 5;

function stripCodeFences(input: string): string {
  return input
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export function normalizeStoryOutlineExpandRequest(
  input: StoryOutlineExpandRequest
): { outline: GeneratedStoryOutline; chapterCount: number; locale: string } {
  const chapterCount =
    typeof input.chapterCount === "number" && input.chapterCount >= 6
      ? Math.min(input.chapterCount, 20)
      : 8;

  if (!input.outline) {
    throw new Error("outline is required");
  }

  return {
    outline: input.outline,
    chapterCount,
    locale: input.locale?.trim() || "en",
  };
}

export function buildStoryOutlineExpandPrompt(input: {
  outline: GeneratedStoryOutline;
  chapterCount: number;
  locale: string;
}): string {
  return [
    "You are expanding a story outline into a chapter-by-chapter writing plan.",
    "Return JSON only with these top-level keys: chapterCount, chapters.",
    "chapters must be an array of objects with number, title, purpose, summary, conflict, endingHook.",
    `Write exactly ${input.chapterCount} chapters.`,
    `Output language: ${input.locale}`,
    `Premise: ${input.outline.premise}`,
    `Core conflict: ${input.outline.coreConflict.protagonistGoal} | ${input.outline.coreConflict.opposition} | ${input.outline.coreConflict.stakes} | ${input.outline.coreConflict.urgency}`,
    `Story arc: ${JSON.stringify(input.outline.storyArc)}`,
    `Key beats: ${JSON.stringify(input.outline.keyBeats)}`,
  ].join("\n");
}

export function parseStoryOutlineExpandResponse(
  rawContent: string
): StoryOutlineChapterPlan {
  const parsed = JSON.parse(
    stripCodeFences(rawContent)
  ) as StoryOutlineChapterPlan;

  if (!Array.isArray(parsed?.chapters) || parsed.chapters.length === 0) {
    throw new Error("chapter plan missing");
  }

  return {
    chapterCount: parsed.chapterCount || parsed.chapters.length,
    chapters: parsed.chapters.map((chapter, index) => ({
      number: chapter.number || index + 1,
      title: chapter.title.trim(),
      purpose: chapter.purpose.trim(),
      summary: chapter.summary.trim(),
      conflict: chapter.conflict.trim(),
      endingHook: chapter.endingHook.trim(),
    })),
  };
}
