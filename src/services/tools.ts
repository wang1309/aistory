export type ModuleId = "ai-write";

export type ToolCategory =
  | "story"
  | "title"
  | "fanfic"
  | "plot"
  | "poem"
  | "dialogue";

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
  badges?: ToolBadge[];
  /**
   * Higher number means higher priority when sorting.
   */
  priority?: number;
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
    badges: ["new"],
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
    badges: ["hot"],
    priority: 90,
  },
  {
    slug: "fanfic-generator",
    nameKey: "ai_tools.tools.fanfic_generator.name",
    shortDescKey: "ai_tools.tools.fanfic_generator.desc",
    module: "ai-write",
    category: "fanfic",
    href: "/fanfic-generator",
    icon: "RiBookMarkedLine",
    priority: 80,
  },
  {
    slug: "dialogue-generator",
    nameKey: "ai_tools.tools.dialogue_generator.name",
    shortDescKey: "ai_tools.tools.dialogue_generator.desc",
    module: "ai-write",
    category: "dialogue",
    href: "/dialogue-generator",
    icon: "RiChat3Line",
    priority: 78,
  },
  {
    slug: "incorrect-quote-generator",
    nameKey: "ai_tools.tools.incorrect_quote_generator.name",
    shortDescKey: "ai_tools.tools.incorrect_quote_generator.desc",
    module: "ai-write",
    category: "dialogue",
    tab: "creative",
    href: "/incorrect-quote-generator",
    icon: "RiDoubleQuotesL",
    badges: ["new"],
    priority: 77,
  },
  {
    slug: "tiktok-comment-generator",
    nameKey: "ai_tools.tools.tiktok_comment_generator.name",
    shortDescKey: "ai_tools.tools.tiktok_comment_generator.desc",
    module: "ai-write",
    category: "dialogue",
    tab: "creative",
    href: "/tiktok-comment-generator",
    icon: "RiMessage3Line",
    badges: ["new"],
    priority: 76,
  },
  {
    slug: "youtube-name-generator",
    nameKey: "ai_tools.tools.youtube_name_generator.name",
    shortDescKey: "ai_tools.tools.youtube_name_generator.desc",
    module: "ai-write",
    category: "dialogue",
    tab: "creative",
    href: "/youtube-name-generator",
    icon: "RiPlayCircleLine",
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
    icon: "RiComicsLine",
    badges: ["new"],
    priority: 76,
  },
  {
    slug: "plot-generator",
    nameKey: "ai_tools.tools.plot_generator.name",
    shortDescKey: "ai_tools.tools.plot_generator.desc",
    module: "ai-write",
    category: "plot",
    href: "/plot-generator",
    icon: "RiMapLine",
    priority: 70,
  },
  {
    slug: "story-outline-generator",
    nameKey: "ai_tools.tools.story_outline_generator.name",
    shortDescKey: "ai_tools.tools.story_outline_generator.desc",
    module: "ai-write",
    category: "plot",
    href: "/story-outline-generator",
    icon: "RiNodeTree",
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
    priority: 55,
  },
  {
    slug: "backstory-generator",
    nameKey: "ai_tools.tools.backstory_generator.name",
    shortDescKey: "ai_tools.tools.backstory_generator.desc",
    module: "ai-write",
    category: "story",
    href: "/backstory-generator",
    icon: "RiUser3Line",
    priority: 85,
  },
  {
    slug: "story-prompt-generator",
    nameKey: "ai_tools.tools.story_prompt_generator.name",
    shortDescKey: "ai_tools.tools.story_prompt_generator.desc",
    module: "ai-write",
    category: "story",
    href: "/story-prompt-generator",
    icon: "RiLightbulbLine",
    priority: 65,
  },
  {
    slug: "bedtime-story-generator",
    nameKey: "ai_tools.tools.bedtime_story_generator.name",
    shortDescKey: "ai_tools.tools.bedtime_story_generator.desc",
    module: "ai-write",
    category: "story",
    href: "/bedtime-story-generator",
    icon: "RiMoonLine",
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
    badges: ["new"],
    priority: 86,
  },
];

export function getToolsByModule(module: ModuleId): Tool[] {
  return tools
    .filter((tool) => tool.module === module)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
