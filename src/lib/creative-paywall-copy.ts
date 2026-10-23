import type { CreativePageKey } from "@/lib/creative-quota-core";

export type CreativePaywallTask =
  | "story"
  | "writing"
  | "name"
  | "creation";

const STORY_GENERATORS = new Set<CreativePageKey>([
  "story-generator",
  "backstory-generator",
  "bedtime-story-generator",
  "comic-generator",
  "dialogue-generator",
  "dnd-backstory-generator",
  "fanfic-generator",
  "fantasy-generator",
  "plot-generator",
  "romance-story-generator",
]);

const WRITING_TOOLS = new Set<CreativePageKey>([
  "ai-humanizer",
  "essay-extender",
  "incorrect-quote-generator",
  "literature-review-generator",
  "paragraph-rewriter",
  "rap-lyric-generator",
  "story-summarizer",
  "story-prompt-generator",
  "tiktok-comment-generator",
]);

const NAME_GENERATORS = new Set<CreativePageKey>([
  "band-name-generator",
  "elf-name-generator",
  "gang-name-generator",
  "middle-name-generator",
  "oc-generator",
  "pen-name-generator",
]);

export function getCreativePaywallTask(
  sourcePage?: CreativePageKey
): CreativePaywallTask {
  if (sourcePage && STORY_GENERATORS.has(sourcePage)) return "story";
  if (sourcePage && WRITING_TOOLS.has(sourcePage)) return "writing";
  if (sourcePage && NAME_GENERATORS.has(sourcePage)) return "name";
  return "creation";
}
