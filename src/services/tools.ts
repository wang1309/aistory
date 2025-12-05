export type ModuleId = "ai-write";

export type ToolCategory =
  | "story"
  | "title"
  | "fanfic"
  | "plot"
  | "poem";

export type ToolBadge = "hot" | "new";

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
    slug: "poem-generator",
    nameKey: "ai_tools.tools.poem_generator.name",
    shortDescKey: "ai_tools.tools.poem_generator.desc",
    module: "ai-write",
    category: "poem",
    href: "/poem-generator",
    icon: "RiQuillPenLine",
    priority: 60,
  },
];

export function getToolsByModule(module: ModuleId): Tool[] {
  return tools
    .filter((tool) => tool.module === module)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
