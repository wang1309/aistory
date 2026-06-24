"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { AnimatedToolsGrid, type ToolCardData } from "./animated-tools-grid";
import type { AccentColor } from "@/components/sections/accent";
import { useTranslations } from "next-intl";

export interface ToolsExplorerTab {
  id: string;
  label: string;
  icon?: string;
  tools: ToolCardData[];
}

interface ToolsExplorerProps {
  tabs: ToolsExplorerTab[];
  newTools?: ToolCardData[];
  accent?: AccentColor;
}

const FILTER_CHIPS: { id: string; labelKey: string }[] = [
  { id: "all", labelKey: "ai_tools.filter_all" },
  { id: "story", labelKey: "ai_tools.filter_story" },
  { id: "title", labelKey: "ai_tools.filter_title" },
  { id: "plot", labelKey: "ai_tools.filter_plot" },
  { id: "poem", labelKey: "ai_tools.filter_poem" },
  { id: "dialogue", labelKey: "ai_tools.filter_dialogue" },
  { id: "fanfic", labelKey: "ai_tools.filter_fanfic" },
];

export function ToolsExplorer({
  tabs,
  newTools = [],
  accent = "orange",
}: ToolsExplorerProps) {
  const t = useTranslations();
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  const categoriesInTab = useMemo(() => {
    if (!activeTab) return new Set<string>();
    return new Set(activeTab.tools.map((tool) => tool.category));
  }, [activeTab]);

  const availableChips = useMemo(
    () => FILTER_CHIPS.filter(
      (chip) => chip.id === "all" || categoriesInTab.has(chip.id)
    ),
    [categoriesInTab]
  );

  const hasFilter = query.trim() !== "" || activeCategory !== "all";
  const showNewSection = !hasFilter && newTools.length > 0;
  const newToolSlugs = useMemo(
    () => new Set(newTools.map((tool) => tool.slug)),
    [newTools]
  );

  const filteredTools = useMemo(() => {
    if (!activeTab) return [];
    const q = query.trim().toLowerCase();
    return activeTab.tools.filter((tool) => {
      if (showNewSection && newToolSlugs.has(tool.slug)) {
        return false;
      }
      if (activeCategory !== "all" && tool.category !== activeCategory) {
        return false;
      }
      if (q) {
        const haystack = `${tool.name} ${tool.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [activeTab, query, activeCategory, showNewSection, newToolSlugs]);

  if (!activeTab) return null;

  return (
    <div className="mt-10">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t("ai_tools.search_placeholder")}
      />

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <TabBar
          tabs={tabs}
          activeId={activeTabId}
          onChange={setActiveTabId}
        />
      </div>

      {availableChips.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
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

      <div className="mt-5 flex items-center justify-center">
        <span className="text-xs text-muted-foreground/60">
          {t("ai_tools.results_count", { count: filteredTools.length })}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab.id}-${activeCategory}-${query.trim()}`}
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {newTools.map((tool) => (
                  <NewToolCard key={tool.slug} tool={tool} accent={accent} />
                ))}
              </div>
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

function TabBar({
  tabs,
  activeId,
  onChange,
}: {
  tabs: ToolsExplorerTab[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Tool categories"
      className="inline-flex items-center gap-1 rounded-full border border-border/20 bg-background/70 p-1 shadow-[0_8px_30px_-12px_rgba(38,28,12,0.18)] backdrop-blur-md dark:border-white/10"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const count = tab.tools.length;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:px-5 sm:py-2.5 sm:text-sm",
              isActive
                ? "text-foreground"
                : "text-muted-foreground/70 hover:text-foreground/80"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="tools-explorer-tab-pill"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary/15 via-primary/10 to-primary/[0.04] ring-1 ring-primary/25"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            {tab.icon && (
              <Icon
                name={tab.icon}
                className={cn(
                  "size-4 shrink-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/60 group-hover:text-foreground/70"
                )}
              />
            )}
            <span>{tab.label}</span>
            <span
              className={cn(
                "ml-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
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
  );
}

function NewToolCard({
  tool,
  accent,
}: {
  tool: ToolCardData;
  accent: AccentColor;
}) {
  return (
    <motion.a
      href={tool.href}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.04] via-card to-card p-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-emerald-500/30 hover:shadow-[0_14px_30px_-18px_rgba(16,185,129,0.35)] dark:border-emerald-400/15 dark:hover:border-emerald-400/30"
      )}
    >
      <div className="shrink-0 rounded-lg border border-border/15 bg-foreground/[0.02] p-0.5">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110",
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
          )}
        >
          <Icon name={tool.icon} className="size-4" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-bold tracking-tight text-foreground">
            {tool.name}
          </h3>
          {tool.badges?.map((badge) => (
            <span
              key={badge.label}
              className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300"
            >
              {badge.label}
            </span>
          ))}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground/60">
          {tool.description}
        </p>
      </div>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.03] text-muted-foreground/40 transition-all duration-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 group-hover:translate-x-0.5 dark:group-hover:text-emerald-300">
        <svg
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" d="M5 3l6 5-6 5" />
        </svg>
      </span>
    </motion.a>
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
