import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  AnimatedToolsGrid,
  type ToolCardData,
  type ToolCardVariant,
} from "./animated-tools-grid";
import type { AccentColor } from "@/components/sections/accent";

/**
 * 分组目录的分类顺序(与原细分类目 chips 一致);分组模式下跳过数据里没有的分类。
 * category "name" 的文案 key 是 filter_name_generator,与 id 不同名。
 */
export const CATEGORY_ORDER = [
  "story",
  "title",
  "poem",
  "social",
  "name",
  "utility",
  "rewriting",
] as const;

export const CATEGORY_LABEL_KEYS: Record<string, string> = {
  // 目录分组用 "Story & Writing"(category_story),与筛选 chips 的 "Story"(filter_story)区分
  story: "ai_tools.category_story",
  title: "ai_tools.filter_title",
  poem: "ai_tools.filter_poem",
  // 目录分组用 "Social Media"(category_social),与筛选 chips 的 "Social"(filter_social)区分
  social: "ai_tools.category_social",
  name: "ai_tools.filter_name_generator",
  utility: "ai_tools.filter_utility",
  rewriting: "ai_tools.category_rewriting",
};

export interface ToolCategoryGroup {
  id: string;
  /** 已翻译的分类标题(ai_tools.filter_* 文案)。 */
  label: string;
  tools: ToolCardData[];
}

interface ToolsDirectoryProps {
  groups: ToolCategoryGroup[];
  accent?: AccentColor;
  variant?: ToolCardVariant;
  /** 底部 All Tools 入口按钮文案。 */
  hubLabel: string;
}

/**
 * 静态分组目录:无搜索、无筛选,服务端渲染分组标题 + 现有卡片网格。
 * 仅动画网格本身是 client island(卡片样式与 explorer 模式完全一致)。
 */
export function ToolsDirectory({
  groups,
  accent = "orange",
  variant = "media",
  hubLabel,
}: ToolsDirectoryProps) {
  return (
    <div className="mt-12">
      <div className="space-y-16">
        {groups.map((group) => (
          <div key={group.id} id={group.id} className="scroll-mt-28">
            <div className="flex items-baseline gap-2.5">
              <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {group.label}
              </h3>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground/50">
                {group.tools.length}
              </span>
            </div>
            <AnimatedToolsGrid
              tools={group.tools}
              accent={accent}
              variant={variant}
              className="mt-6"
            />
          </div>
        ))}
      </div>

      {/* Hub entry: standalone centered button below the groups */}
      <div className="mt-16 flex justify-center">
        <Link
          href="/ai-tools"
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-background px-5 py-2 text-sm font-semibold text-foreground transition-colors",
            "hover:border-border/50 hover:bg-foreground/[0.04]"
          )}
        >
          {hubLabel}
          <svg
            viewBox="0 0 16 16"
            className="size-3.5 text-muted-foreground/50 transition-colors duration-300 group-hover:text-foreground/70"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M5 3l6 5-6 5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
