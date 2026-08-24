"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { AnimatedToolsGrid, type ToolCardData } from "./animated-tools-grid";
import type { AccentColor } from "@/components/sections/accent";
import type { ToolGroup } from "@/services/tools";
import { useTranslations } from "next-intl";

interface ToolsExplorerProps {
  tools: ToolCardData[];
  newTools?: ToolCardData[];
  accent?: AccentColor;
  /**
   * true 时筛选项切到粗粒度三大组(Writing/Social/Name),
   * false(默认)保持细分类目 chips。All Tools hub 用 true。
   */
  groupedChips?: boolean;
}

const FILTER_CHIPS: { id: string; labelKey: string }[] = [
  { id: "all", labelKey: "ai_tools.filter_all" },
  { id: "story", labelKey: "ai_tools.filter_story" },
  { id: "character", labelKey: "ai_tools.filter_character" },
  { id: "plot", labelKey: "ai_tools.filter_plot" },
  { id: "title", labelKey: "ai_tools.filter_title" },
  { id: "poem", labelKey: "ai_tools.filter_poem" },
  { id: "social", labelKey: "ai_tools.filter_social" },
  { id: "name", labelKey: "ai_tools.filter_name_generator" },
  { id: "utility", labelKey: "ai_tools.filter_utility" },
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
  newTools = [],
  accent = "orange",
  groupedChips = false,
}: ToolsExplorerProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const chips = groupedChips ? GROUP_CHIPS : FILTER_CHIPS;

  // 细分类目模式下只显示当前数据里存在的分类;大组模式下三组恒有值
  const availableChips = useMemo(() => {
    if (groupedChips) return chips;
    const categoriesInTools = new Set(tools.map((tool) => tool.category));
    return chips.filter(
      (chip) => chip.id === "all" || categoriesInTools.has(chip.id)
    );
  }, [chips, groupedChips, tools]);

  const hasFilter = query.trim() !== "" || activeCategory !== "all";
  const showNewSection = !hasFilter && newTools.length > 0;
  const newToolSlugs = useMemo(
    () => new Set(newTools.map((tool) => tool.slug)),
    [newTools]
  );

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      if (showNewSection && newToolSlugs.has(tool.slug)) return false;
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
  }, [
    tools,
    query,
    activeCategory,
    showNewSection,
    newToolSlugs,
    groupedChips,
  ]);

  return (
    <div className="mt-10">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t("ai_tools.search_placeholder")}
      />

      {availableChips.length > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
          {availableChips.map((chip) => {
            const isActive = activeCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveCategory(chip.id)}
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

      <div className="mt-4 flex items-center justify-center">
        <span className="text-xs text-muted-foreground/60">
          {t("ai_tools.results_count", { count: filteredTools.length })}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeCategory}-${query.trim()}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        >
          {showNewSection && (
            <div className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                  <Icon name="RiSparkling2Line" className="size-3.5" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700/90 dark:text-emerald-300/90">
                  {t("ai_tools.new_tools_section")}
                </span>
              </div>
              <AnimatedToolsGrid tools={newTools} accent={accent} className="mt-0" />
            </div>
          )}

          {filteredTools.length > 0 ? (
            <AnimatedToolsGrid tools={filteredTools} accent={accent} />
          ) : (
            <EmptyState
              message={t("ai_tools.no_results")}
              onReset={() => {
                setQuery("");
                setActiveCategory("all");
              }}
              resetLabel={t("ai_tools.clear_filters")}
            />
          )}
        </motion.div>
      </AnimatePresence>
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
            "w-full rounded-full border border-border/25 bg-background/70 py-3 pl-11 pr-10 text-sm text-foreground shadow-[0_8px_30px_-12px_rgba(38,28,12,0.18)] outline-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-md",
            "placeholder:text-muted-foreground/45",
            "focus:border-primary/35 focus:bg-background/90 focus:shadow-[0_12px_40px_-12px_rgba(38,28,12,0.25)]",
            "dark:border-white/10 dark:bg-white/[0.03]"
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
