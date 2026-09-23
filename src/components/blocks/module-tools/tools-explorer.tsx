"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import {
  AnimatedToolsGrid,
  type ToolCardData,
  type ToolCardVariant,
} from "./animated-tools-grid";
import type { AccentColor } from "@/components/sections/accent";
import type { ToolGroup } from "@/services/tools";
import { useTranslations } from "next-intl";

interface ToolsExplorerProps {
  tools: ToolCardData[];
  accent?: AccentColor;
  /**
   * true 时筛选项切到粗粒度三大组(Writing/Social/Name),
   * false(默认)保持细分类目 chips。All Tools hub 用 true。
   */
  groupedChips?: boolean;
  /** 卡片变体,透传给 AnimatedToolsGrid。首页传 "compact" 走无图紧凑卡。 */
  variant?: ToolCardVariant;
}

const FILTER_CHIPS: { id: string; labelKey: string }[] = [
  { id: "all", labelKey: "ai_tools.filter_all" },
  { id: "story", labelKey: "ai_tools.filter_story" },
  { id: "title", labelKey: "ai_tools.filter_title" },
  { id: "poem", labelKey: "ai_tools.filter_poem" },
  { id: "social", labelKey: "ai_tools.filter_social" },
  { id: "name", labelKey: "ai_tools.filter_name_generator" },
  { id: "utility", labelKey: "ai_tools.filter_utility" },
  { id: "rewriting", labelKey: "ai_tools.category_rewriting" },
];

// All Tools hub 的粗粒度筛选:顺序即展示顺序
const GROUP_CHIPS: { id: ToolGroup | "all"; labelKey: string }[] = [
  { id: "all", labelKey: "ai_tools.filter_all" },
  { id: "social", labelKey: "ai_tools.group_social" },
  { id: "name", labelKey: "ai_tools.group_name" },
  { id: "writing", labelKey: "ai_tools.group_writing" },
];

export function ToolsExplorer({
  tools,
  accent = "orange",
  groupedChips = false,
  variant = "media",
}: ToolsExplorerProps) {
  const t = useTranslations();
  // compact(首页)走 tab 分类模式:无 all,默认 story,徽标显示数量;
  // media(工具目录/hub)保持原 chips + all + 统计行。
  const isTabMode = variant === "compact";
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(() =>
    isTabMode ? "story" : "all"
  );

  const chips = groupedChips ? GROUP_CHIPS : FILTER_CHIPS;

  // 细分类目模式下只显示当前数据里存在的分类;大组模式下三组恒有值。
  // tab 模式去掉 all,只留数据里真实存在的细分类目。
  const availableChips = useMemo(() => {
    if (groupedChips) return chips;
    const categoriesInTools = new Set(tools.map((tool) => tool.category));
    return chips.filter((chip) =>
      isTabMode
        ? chip.id !== "all" && categoriesInTools.has(chip.id)
        : chip.id === "all" || categoriesInTools.has(chip.id)
    );
  }, [chips, groupedChips, tools, isTabMode]);

  // 选中项不在可用列表时(tab 模式没有 all 兜底)回落到第一个可用分类
  const activeCategory = availableChips.some((chip) => chip.id === selectedId)
    ? selectedId
    : (availableChips[0]?.id ?? selectedId);

  // 各分类工具数,tab 徽标用(tab 模式下取代原统计行)
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tool of tools) {
      const key = groupedChips ? (tool.group ?? "") : tool.category;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [tools, groupedChips]);

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      if (
        activeCategory !== "all" &&
        (groupedChips ? tool.group : tool.category) !== activeCategory
      ) {
        return false;
      }
      if (q) {
        const haystack = `${tool.name} ${tool.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tools, query, activeCategory, groupedChips]);

  return (
    <div className="mt-10">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t("ai_tools.search_placeholder")}
      />

      {isTabMode && availableChips.length > 1 && (
        <CategoryTabs
          tabs={availableChips}
          activeId={activeCategory}
          counts={categoryCounts}
          labelFor={(key) => t(key)}
          onSelect={setSelectedId}
        />
      )}

      {!isTabMode && availableChips.length > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
          {availableChips.map((chip) => {
            const isActive = activeCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedId(chip.id)}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/20 bg-background/60 text-muted-foreground/70 hover:border-border/40 hover:text-foreground/80"
                )}
              >
                {t(chip.labelKey)}
              </button>
            );
          })}
        </div>
      )}

      {!isTabMode && (
        <div className="mt-4 flex items-center justify-center">
          <span className="text-xs text-muted-foreground/60">
            {t("ai_tools.results_count", { count: filteredTools.length })}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeCategory}-${query.trim()}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        >
          {filteredTools.length > 0 ? (
            <AnimatedToolsGrid tools={filteredTools} accent={accent} variant={variant} />
          ) : (
            <EmptyState
              message={t("ai_tools.no_results")}
              onReset={() => {
                setQuery("");
                setSelectedId(isTabMode ? "story" : "all");
              }}
              resetLabel={t("ai_tools.clear_filters")}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hub entry: standalone centered button below the grid */}
      <div className="mt-10 flex justify-center">
        <Link
          href="/ai-tools"
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-background px-5 py-2 text-sm font-semibold text-foreground transition-colors",
            "hover:border-border/50 hover:bg-foreground/[0.04]"
          )}
        >
          {t("ai_tools.tools_hub_nav")}
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

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className="group relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary/70">
          <Icon name="RiSearchLine" className="size-4" />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-full border border-border bg-background py-3 pl-11 pr-10 text-sm text-foreground shadow-sm outline-hidden transition-colors duration-200",
            "placeholder:text-muted-foreground/45",
            "focus:border-primary/40 focus:outline-none",
            "dark:border-input dark:bg-input/30"
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
            aria-label="Clear search"
          >
            <Icon name="RiCloseLine" className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  message,
  onReset,
  resetLabel,
}: {
  message: string;
  onReset: () => void;
  resetLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/50">
        <Icon name="RiSearchEyeLine" className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground/70">{message}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-background px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.04]"
      >
        <Icon name="RiRefreshLine" className="size-3.5" />
        {resetLabel}
      </button>
    </div>
  );
}

/**
 * 首页(compact)的分类 tab:胶囊分段器 + 滑动 pill + 数量徽标。
 * 视觉范式与 module-tools-tabs 保持一致;layoutId 独立命名空间,避免跨实例冲突。
 */
function CategoryTabs({
  tabs,
  activeId,
  counts,
  labelFor,
  onSelect,
}: {
  tabs: { id: string; labelKey: string }[];
  activeId: string;
  counts: Map<string, number>;
  labelFor: (labelKey: string) => string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-5 flex justify-center">
      <div className="max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div
          role="tablist"
          aria-label="Tool categories"
          className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-background p-1 shadow-sm dark:border-input"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const count = counts.get(tab.id) ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelect(tab.id)}
                className={cn(
                  "group relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:px-4 sm:text-[13px]",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground/70 hover:text-foreground/80"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="tools-explorer-tab-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-muted ring-1 ring-border"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span>{labelFor(tab.labelKey)}</span>
                <span
                  className={cn(
                    "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-foreground/[0.04] text-muted-foreground/60"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
