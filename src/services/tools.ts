import type { AccentColor } from "@/components/sections/accent";

export type ModuleId = "ai-write" | "ai-tools";

export type ToolCategory =
  | "story"
  | "character"
  | "plot"
  | "title"
  | "poem"
  | "social"
  | "name"
  | "utility";

export type ToolBadge = "hot" | "new";

/**
 * Top-level grouping used to split a module's tool list into tabs.
 * - "story"  — core writing tools (default)
 * - "creative" — genre play / format-specific creative tools
 */
export type ToolTab = "story" | "creative";

export interface Tool {
  slug: string;
  /**
   * Translation key for the human readable name, used as card title.
   */
  nameKey: string;
  /**
   * Translation key for the short description shown on the card.
   */
  shortDescKey: string;
  module: ModuleId;
  category: ToolCategory;
  tab?: ToolTab;
  /**
   * Absolute path (without locale prefix), e.g. "/book-title-generator".
   */
  href: string;
  /**
   * Remix icon name, e.g. "RiQuillPenLine".
   */
  icon: string;
  /**
   * Per-tool accent used for the tool-directory card cover. Falls back to
   * the section accent when omitted.
   */
  accent?: AccentColor;
  /**
   * Optional cover image URL (e.g. R2-hosted webp). When present the card
   * cover renders this image instead of the accent-gradient tile.
   */
  image?: string;
  badges?: ToolBadge[];
  /**
   * Higher number means higher priority when sorting.
   */
  priority?: number;
  /**
   * Optional extra keywords for Hub search matching. Falls back to name + desc.
   */
  keywords?: string[];
}

export const tools: Tool[] = [
  {
    slug: "story-generator",
    nameKey: "ai_tools.tools.story_generator.name",
    shortDescKey: "ai_tools.tools.story_generator.desc",
    module: "ai-write",
    category: "story",
    href: "/",
    icon: "RiBookOpenLine",
    image: "https://r2.storiesgenerator.org/image/story_generator.webp",
    badges: ["hot"],
    priority: 100,
  },
  {
    slug: "fantasy-generator",
    nameKey: "ai_tools.tools.fantasy_generator.name",
    shortDescKey: "ai_tools.tools.fantasy_generator.desc",
    module: "ai-write",
    category: "story",
    href: "/fantasy-generator",
    icon: "RiSparkling2Line",
    image: "https://r2.storiesgenerator.org/image/fantasy_story_generator.webp",
    badges: ["hot"],
    priority: 95,
  },
  {
    slug: "book-title-generator",
    nameKey: "ai_tools.tools.book_title_generator.name",
    shortDescKey: "ai_tools.tools.book_title_generator.desc",
    module: "ai-write",
    category: "title",
    href: "/book-title-generator",
    icon: "RiQuillPenLine",
    image: "https://r2.storiesgenerator.org/image/book_title_generator.webp",
    priority: 89,
  },
  {
    slug: "fanfic-generator",
    nameKey: "ai_tools.tools.fanfic_generator.name",
    shortDescKey: "ai_tools.tools.fanfic_generator.desc",
    module: "ai-write",
    category: "character",
    href: "/fanfic-generator",
    icon: "RiBookMarkedLine",
    image: "https://r2.storiesgenerator.org/image/fanfic_story_generator.webp",
    badges: ["hot"],
    priority: 96,
  },
  {
    slug: "dialogue-generator",
    nameKey: "ai_tools.tools.dialogue_generator.name",
    shortDescKey: "ai_tools.tools.dialogue_generator.desc",
    module: "ai-write",
    category: "social",
    href: "/dialogue-generator",
    icon: "RiChat3Line",
    image: "https://r2.storiesgenerator.org/image/dialogue_generator.webp",
    badges: ["hot"],
    priority: 78,
  },
  {
    slug: "incorrect-quote-generator",
    nameKey: "ai_tools.tools.incorrect_quote_generator.name",
    shortDescKey: "ai_tools.tools.incorrect_quote_generator.desc",
    module: "ai-write",
    category: "social",
    tab: "creative",
    href: "/incorrect-quote-generator",
    icon: "RiDoubleQuotesL",
    // 文件名拼写以 R2 实际对象为准(incrorrect)
    image: "https://r2.storiesgenerator.org/image/incrorrect_quote_generator.webp",
    badges: ["new"],
    priority: 77,
  },
  {
    slug: "tiktok-comment-generator",
    nameKey: "ai_tools.tools.tiktok_comment_generator.name",
    shortDescKey: "ai_tools.tools.tiktok_comment_generator.desc",
    module: "ai-write",
    category: "social",
    tab: "creative",
    href: "/tiktok-comment-generator",
    icon: "RiMessage3Line",
    image: "https://r2.storiesgenerator.org/image/tiktok_comment_generator.webp",
    badges: ["new"],
    priority: 76,
  },
  {
    slug: "youtube-name-generator",
    nameKey: "ai_tools.tools.youtube_name_generator.name",
    shortDescKey: "ai_tools.tools.youtube_name_generator.desc",
    module: "ai-write",
    category: "social",
    tab: "creative",
    href: "/youtube-name-generator",
    icon: "RiPlayCircleLine",
    image: "https://r2.storiesgenerator.org/image/youtube_name_generator.webp",
    badges: ["new"],
    priority: 75,
  },
  {
    slug: "youtube-title-generator",
    nameKey: "ai_tools.tools.youtube_title_generator.name",
    shortDescKey: "ai_tools.tools.youtube_title_generator.desc",
    module: "ai-write",
    category: "title",
    tab: "creative",
    href: "/youtube-title-generator",
    icon: "RiYoutubeLine",
    image: "https://r2.storiesgenerator.org/image/youtube_title_generator.webp",
    badges: ["new"],
    priority: 74,
  },
  {
    slug: "comic-generator",
    nameKey: "ai_tools.tools.comic_generator.name",
    shortDescKey: "ai_tools.tools.comic_generator.desc",
    module: "ai-write",
    category: "story",
    href: "/comic-generator",
    icon: "RiBrushLine",
    image: "https://r2.storiesgenerator.org/image/ai_comic_generator.webp",
    priority: 94,
  },
  {
    slug: "plot-generator",
    nameKey: "ai_tools.tools.plot_generator.name",
    shortDescKey: "ai_tools.tools.plot_generator.desc",
    module: "ai-write",
    category: "plot",
    href: "/plot-generator",
    icon: "RiMapLine",
    image: "https://r2.storiesgenerator.org/image/plot_generator.webp",
    priority: 90,
  },
  {
    slug: "story-outline-generator",
    nameKey: "ai_tools.tools.story_outline_generator.name",
    shortDescKey: "ai_tools.tools.story_outline_generator.desc",
    module: "ai-write",
    category: "plot",
    href: "/story-outline-generator",
    icon: "RiNodeTree",
    image: "https://r2.storiesgenerator.org/image/story_outline_generator.webp",
    badges: ["new"],
    priority: 72,
  },
  {
    slug: "poem-generator",
    nameKey: "ai_tools.tools.poem_generator.name",
    shortDescKey: "ai_tools.tools.poem_generator.desc",
    module: "ai-write",
    category: "poem",
    href: "/poem-generator",
    icon: "RiQuillPenLine",
    image: "https://r2.storiesgenerator.org/image/poem_generator.webp",
    priority: 60,
  },
  {
    slug: "poem-title-generator",
    nameKey: "ai_tools.tools.poem_title_generator.name",
    shortDescKey: "ai_tools.tools.poem_title_generator.desc",
    module: "ai-write",
    category: "title",
    href: "/poem-title-generator",
    icon: "RiStarLine",
    image: "https://r2.storiesgenerator.org/image/poem_title_generator.webp",
    badges: ["hot"],
    priority: 91,
  },
  {
    slug: "backstory-generator",
    nameKey: "ai_tools.tools.backstory_generator.name",
    shortDescKey: "ai_tools.tools.backstory_generator.desc",
    module: "ai-write",
    category: "character",
    href: "/backstory-generator",
    icon: "RiUser3Line",
    image: "https://r2.storiesgenerator.org/image/backstory_generator.webp",
    badges: ["hot"],
    priority: 99,
  },
  {
    slug: "dnd-backstory-generator",
    nameKey: "ai_tools.tools.dnd_backstory_generator.name",
    shortDescKey: "ai_tools.tools.dnd_backstory_generator.desc",
    module: "ai-write",
    category: "character",
    href: "/dnd-backstory-generator",
    icon: "RiDiceLine",
    image: "https://r2.storiesgenerator.org/image/dnd_backstory_generator.webp",
    badges: ["hot"],
    priority: 97,
  },
  {
    slug: "bedtime-story-generator",
    nameKey: "ai_tools.tools.bedtime_story_generator.name",
    shortDescKey: "ai_tools.tools.bedtime_story_generator.desc",
    module: "ai-write",
    category: "story",
    href: "/bedtime-story-generator",
    icon: "RiMoonLine",
    image: "https://r2.storiesgenerator.org/image/bedtime_story_generator.webp",
    badges: ["new"],
    priority: 88,
  },
  {
    slug: "romance-story-generator",
    nameKey: "ai_tools.tools.romance_story_generator.name",
    shortDescKey: "ai_tools.tools.romance_story_generator.desc",
    module: "ai-write",
    category: "story",
    href: "/romance-story-generator",
    icon: "RiHeartLine",
    image: "https://r2.storiesgenerator.org/image/romance_story_generator.webp",
    badges: ["new"],
    priority: 86,
  },
  {
    slug: "literature-review-generator",
    nameKey: "ai_tools.tools.literature_review_generator.name",
    shortDescKey: "ai_tools.tools.literature_review_generator.desc",
    module: "ai-write",
    category: "story",
    tab: "creative",
    href: "/literature-review-generator",
    icon: "RiBookOpenLine",
    // 文件名拼写以 R2 实际对象为准(liretature)
    image: "https://r2.storiesgenerator.org/image/liretature_review_generator.webp",
    badges: ["new"],
    priority: 84,
  },
  {
    slug: "story-prompt-generator",
    nameKey: "ai_tools.tools.story_prompt_generator.name",
    shortDescKey: "ai_tools.tools.story_prompt_generator.desc",
    module: "ai-write",
    category: "plot",
    href: "/story-prompt-generator",
    icon: "RiLightbulbLine",
    image: "https://r2.storiesgenerator.org/image/story_prompt_generator.webp",
    priority: 65,
  },
  {
    slug: "city-nickname-generator",
    nameKey: "ai_tools.tools.city_nickname_generator.name",
    shortDescKey: "ai_tools.tools.city_nickname_generator.desc",
    module: "ai-write",
    category: "social",
    tab: "creative",
    href: "/city-nickname-generator",
    icon: "RiMapPin2Line",
    image: "https://r2.storiesgenerator.org/image/city_nickname_generator.webp",
    badges: ["new"],
    priority: 73,
  },
  {
    slug: "emoji-translator",
    nameKey: "ai_tools.tools.emoji_translator.name",
    shortDescKey: "ai_tools.tools.emoji_translator.desc",
    module: "ai-tools",
    category: "social",
    href: "/ai-tools/emoji-translator",
    icon: "RiEmotionHappyLine",
    accent: "orange",
    image: "https://r2.storiesgenerator.org/image/emoji_translator1.webp",
    badges: ["new"],
    priority: 100,
  },
  {
    slug: "elf-name-generator",
    nameKey: "ai_tools.tools.elf_name_generator.name",
    shortDescKey: "ai_tools.tools.elf_name_generator.desc",
    module: "ai-tools",
    category: "name",
    href: "/ai-tools/elf-name-generator",
    icon: "RiLeafLine",
    accent: "orange",
    image: "https://r2.storiesgenerator.org/image/elf_name_generator.webp",
    badges: ["new"],
    priority: 95,
  },
  {
    slug: "pen-name-generator",
    nameKey: "ai_tools.tools.pen_name_generator.name",
    shortDescKey: "ai_tools.tools.pen_name_generator.desc",
    module: "ai-tools",
    category: "name",
    href: "/ai-tools/pen-name-generator",
    icon: "RiQuillPenLine",
    accent: "orange",
    image: "https://r2.storiesgenerator.org/image/pen_name_generator.webp",
    badges: ["new"],
    priority: 94,
  },
  {
    slug: "gang-name-generator",
    nameKey: "ai_tools.tools.gang_name_generator.name",
    shortDescKey: "ai_tools.tools.gang_name_generator.desc",
    module: "ai-tools",
    category: "name",
    href: "/ai-tools/gang-name-generator",
    icon: "RiSwordLine",
    accent: "rose",
    image: "https://r2.storiesgenerator.org/image/gang_name_generator.webp",
    badges: ["new"],
    priority: 93,
  },
  {
    slug: "band-name-generator",
    nameKey: "ai_tools.tools.band_name_generator.name",
    shortDescKey: "ai_tools.tools.band_name_generator.desc",
    module: "ai-tools",
    category: "name",
    href: "/ai-tools/band-name-generator",
    icon: "RiMicLine",
    accent: "amber",
    image: "https://r2.storiesgenerator.org/image/band_name_generator.webp",
    badges: ["new"],
    priority: 92,
  },
  {
    slug: "random-nfl-team-generator",
    nameKey: "ai_tools.tools.random_nfl_team_generator.name",
    shortDescKey: "ai_tools.tools.random_nfl_team_generator.desc",
    module: "ai-tools",
    category: "name",
    href: "/ai-tools/random-nfl-team-generator",
    icon: "RiTrophyLine",
    accent: "emerald",
    image: "https://r2.storiesgenerator.org/image/random_nfl_team_generator.webp",
    badges: ["new"],
    priority: 91,
    keywords: ["nfl", "football", "randomizer", "fantasy draft", "pool"],
  },
  {
    slug: "middle-name-generator",
    nameKey: "ai_tools.tools.middle_name_generator.name",
    shortDescKey: "ai_tools.tools.middle_name_generator.desc",
    module: "ai-tools",
    category: "name",
    href: "/ai-tools/middle-name-generator",
    icon: "RiFingerprint2Line",
    accent: "teal",
    image: "https://r2.storiesgenerator.org/image/middle_name_generator.webp",
    badges: ["new"],
    priority: 90,
    keywords: [
      "middle name",
      "middle names",
      "character names",
      "full name",
      "initials",
      "byline",
    ],
  },
];

export function getToolsByModule(module: ModuleId): Tool[] {
  return tools
    .filter((tool) => tool.module === module)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/**
 * Coarse grouping used by the All Tools hub filter chips. Fine-grained
 * categories stay untouched — this is only a roll-up for the hub page.
 */
export type ToolGroup = "writing" | "social" | "name";

const CATEGORY_GROUP: Record<ToolCategory, ToolGroup> = {
  story: "writing",
  character: "writing",
  plot: "writing",
  title: "writing",
  poem: "writing",
  utility: "writing",
  social: "social",
  name: "name",
};

export function getToolGroup(tool: Tool): ToolGroup {
  return CATEGORY_GROUP[tool.category];
}

export function getAllTools(): Tool[] {
  return [...tools].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function getTopTools(module: ModuleId, limit: number): Tool[] {
  return getToolsByModule(module).slice(0, limit);
}

export function getToolsBySlugs(slugs: string[]): Tool[] {
  return slugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is Tool => Boolean(tool));
}

export function getNewTools(module: ModuleId): Tool[] {
  return getToolsByModule(module).filter((tool) =>
    tool.badges?.includes("new")
  );
}

export function getToolsByCategory(
  module: ModuleId,
  category: ToolCategory
): Tool[] {
  return getToolsByModule(module).filter((tool) => tool.category === category);
}

export function getFeaturedTools(module: ModuleId, limit: number): Tool[] {
  return getToolsByModule(module)
    .filter((tool) => tool.badges?.includes("hot"))
    .slice(0, limit);
}
