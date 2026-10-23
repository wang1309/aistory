"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import Icon from "@/components/icon";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABEL_KEYS,
  CATEGORY_ORDER,
} from "@/components/blocks/module-tools/tools-directory";
import { getToolsByModule, type Tool } from "@/services/tools";

/** 分类栏图标，与 /ai-write-tool 目录的分组一一对应。 */
const CATEGORY_ICONS: Record<string, string> = {
  story: "RiBookOpenLine",
  title: "RiQuillPenLine",
  poem: "RiQuillPenLine",
  social: "RiChat3Line",
  name: "RiChat3Line",
  utility: "RiEdit2Line",
  rewriting: "RiEdit2Line",
};

export type HeaderToolBadge = "hot" | "new";

export type HeaderToolItem = {
  tool: Tool;
  name: string;
  description: string;
  href: string;
  icon: string;
  badge?: HeaderToolBadge;
};

export type HeaderToolRow = {
  id: string;
  label: string;
  icon: string;
  items: HeaderToolItem[];
};

/**
 * 与 /ai-write-tool 目录同源的数据：同顺序、同分类、同文案。
 * Story Generator 是站点首页入口，不在下拉中重复展示。
 */
export function useWritingToolsMenu() {
  const t = useTranslations();
  const moduleTools = getToolsByModule("ai-write");
  const menuTools = moduleTools.filter((tool) => tool.slug !== "story-generator");

  const toItem = (tool: Tool): HeaderToolItem => ({
    tool,
    name: t(tool.nameKey),
    description: t(tool.shortDescKey),
    href: tool.href,
    icon: tool.icon,
    badge: tool.badges?.includes("hot")
      ? "hot"
      : tool.badges?.includes("new")
      ? "new"
      : undefined,
  });

  const rows: HeaderToolRow[] = CATEGORY_ORDER.map((id) => ({
    id,
    label: t(CATEGORY_LABEL_KEYS[id]),
    icon: CATEGORY_ICONS[id] ?? "RiBookOpenLine",
    items: menuTools.filter((tool) => tool.category === id).map(toItem),
  })).filter((row) => row.items.length > 0);

  return { rows, total: moduleTools.length };
}

function CategoryLabel({ label }: { label: string }) {
  return (
    <>
      {label.split(/([&＆])/).map((part, index) => (
        <Fragment key={index}>
          {part}
          {/[&＆]/.test(part) ? <wbr /> : null}
        </Fragment>
      ))}
    </>
  );
}

function ToolBadge({ badge }: { badge?: HeaderToolBadge }) {
  const t = useTranslations();
  if (!badge) return null;

  return (
    <span
      className={cn(
        "pointer-events-none inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]",
        badge === "hot"
          ? "bg-accent-rose text-accent-copper"
          : "bg-accent-sage text-primary"
      )}
    >
      {badge === "hot" ? t("ai_tools.badge_hot") : t("ai_tools.badge_new")}
    </span>
  );
}

interface ToolsMenuProps {
  rows: HeaderToolRow[];
  total: number;
  hubHref: string;
}

function useActiveRow(rows: HeaderToolRow[]) {
  const [activeId, setActiveId] = useState(() => rows[0]?.id ?? "");
  const activeRow = rows.find((row) => row.id === activeId) ?? rows[0];
  return { setActiveId, activeRow };
}

export function ToolsMegaMenu({ rows, total, hubHref }: ToolsMenuProps) {
  const t = useTranslations();
  const { setActiveId, activeRow } = useActiveRow(rows);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rightPaneRef.current?.scrollTo({ top: 0 });
  }, [activeRow?.id]);

  if (!activeRow) return null;

  return (
    <div className="flex h-[min(46rem,calc(100dvh_-_5.5rem))] w-[59rem] max-w-[calc(100vw_-_2rem)] flex-col overflow-hidden rounded-[2px] bg-popover min-[1360px]:w-[62rem] 2xl:w-[66rem]">
      <div className="flex shrink-0 items-end justify-between gap-6 border-b border-border/70 px-8 pb-5 pt-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-copper">
            {t("ai_tools.group_writing")}
          </p>
          <p className="mt-2 max-w-[42rem] text-balance font-display text-[34px] font-normal leading-[1.04] tracking-[-0.03em] text-foreground 2xl:text-[38px]">
            {t("ai_tools.menu_title")}
          </p>
        </div>
        <Link
          href={hubHref as any}
          className="group/all inline-flex shrink-0 items-center gap-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors duration-200 hover:text-primary focus-visible:text-primary"
        >
          {t("ai_tools.view_all_cta", { count: total })}
          <Icon
            name="RiArrowRightLine"
            className="size-4 transition-transform duration-200 group-hover/all:translate-x-1"
          />
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[15.5rem_1fr] grid-rows-[minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto border-r border-border/70 bg-[#f0ece3] p-4 dark:bg-muted/20">
          <div
            role="group"
            aria-label={t("ai_tools.group_writing")}
            className="flex flex-col gap-1"
          >
            {rows.map((row) => {
              const isActive = row.id === activeRow.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  aria-pressed={isActive}
                  onMouseEnter={() => setActiveId(row.id)}
                  onFocus={() => setActiveId(row.id)}
                  onClick={() => setActiveId(row.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[2px] border-0 px-3 py-3 text-left transition-all duration-200",
                    isActive
                      ? "bg-card text-foreground ring-1 ring-border shadow-[3px_3px_0_rgba(36,77,61,0.07)] dark:shadow-[3px_3px_0_rgba(0,0,0,0.35)]"
                      : "bg-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-[2px] transition-colors duration-200",
                      isActive
                        ? "bg-accent-sage text-accent-copper"
                        : "bg-muted/75 text-muted-foreground"
                    )}
                  >
                    <Icon name={row.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug [word-break:keep-all]">
                      <CategoryLabel label={row.label} />
                    </span>
                    <span className="mt-1 block text-[10.5px] leading-none text-muted-foreground">
                      {t("ai_tools.results_count", { count: row.items.length })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div ref={rightPaneRef} className="min-h-0 overflow-y-auto bg-popover">
          <div className="sticky top-0 z-10 flex items-baseline justify-between gap-3 border-b border-border/50 bg-popover/95 px-7 py-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground">
              {activeRow.label}
            </p>
            <span className="text-[10px] text-muted-foreground/70">
              {t("ai_tools.results_count", { count: activeRow.items.length })}
            </span>
          </div>

          <div
            key={activeRow.id}
            className="grid animate-in grid-cols-2 gap-x-6 px-7 pb-4 pt-2 fade-in duration-200"
          >
            {activeRow.items.map((item) => (
              <NavigationMenuLink key={item.tool.slug} asChild>
                <Link
                  href={item.href as any}
                  className="group flex items-start gap-3 rounded-[2px] px-2 py-2.5 transition-colors duration-200 hover:bg-accent-sage/30 focus-visible:bg-accent-sage/30"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[2px] bg-accent-sage/70 text-accent-copper transition-colors duration-200 group-hover:bg-accent-sage">
                    <Icon name={item.icon} className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className="min-w-0 flex-1 font-display text-[16.5px] leading-[1.22] tracking-[-0.01em] text-foreground transition-colors duration-200 group-hover:text-primary">
                        {item.name}
                      </span>
                      <ToolBadge badge={item.badge} />
                    </span>
                    <span className="mt-1 line-clamp-1 text-[11px] leading-[1.35] text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </NavigationMenuLink>
            ))}
          </div>
        </div>
      </div>

      <Link
        href={hubHref as any}
        className="group/all-cta flex shrink-0 items-center gap-4 border-t border-border/70 bg-accent-sage/25 px-8 py-3.5 transition-colors duration-200 hover:bg-accent-sage/40"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[2px] bg-primary text-primary-foreground">
          <Icon name="RiGridLine" className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[19px] leading-none tracking-[-0.01em] text-foreground">
            {t("ai_tools.view_all_cta", { count: total })}
          </span>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("ai_tools.view_all_sub")}
          </span>
        </span>
        <span className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-transform duration-200 group-hover/all-cta:translate-x-1">
          <Icon name="RiArrowRightLine" className="size-4" />
        </span>
      </Link>
    </div>
  );
}

export function ToolsMobileMenu({ rows, total, hubHref }: ToolsMenuProps) {
  const t = useTranslations();
  const { setActiveId, activeRow } = useActiveRow(rows);

  if (!activeRow) return null;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label={t("ai_tools.group_writing")}
        className="grid grid-cols-2 gap-2"
      >
        {rows.map((row) => {
          const isActive = row.id === activeRow.id;
          return (
            <button
              key={row.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveId(row.id)}
              className={cn(
                "flex min-h-[4.25rem] items-center gap-2.5 rounded-[2px] border-0 px-3 py-3 text-left transition-colors duration-200",
                isActive
                  ? "bg-card text-foreground ring-1 ring-border shadow-[3px_3px_0_rgba(36,77,61,0.07)] dark:shadow-[3px_3px_0_rgba(0,0,0,0.35)]"
                  : "bg-muted/45 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-[2px]",
                  isActive
                    ? "bg-accent-sage text-accent-copper"
                    : "bg-card/70 text-muted-foreground"
                )}
              >
                <Icon name={row.icon} className="size-4" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[13px] font-semibold leading-snug [word-break:keep-all]",
                    isActive ? "text-foreground" : "text-foreground/80"
                  )}
                >
                  <CategoryLabel label={row.label} />
                </span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {t("ai_tools.results_count", { count: row.items.length })}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-[2px] border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
            {activeRow.label}
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            {t("ai_tools.results_count", { count: activeRow.items.length })}
          </span>
        </div>
        <div
          key={activeRow.id}
          className="animate-in divide-y divide-border/50 fade-in duration-200"
        >
          {activeRow.items.map((item) => (
            <Link
              key={item.tool.slug}
              href={item.href as any}
              className="group flex items-start gap-3 px-4 py-3 transition-colors duration-200 hover:bg-accent-sage/30"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[2px] bg-accent-sage/70 text-accent-copper">
                <Icon name={item.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start gap-2">
                  <span className="min-w-0 flex-1 font-display text-[15px] leading-snug text-foreground">
                    {item.name}
                  </span>
                  <ToolBadge badge={item.badge} />
                </span>
                <span className="mt-1 line-clamp-1 text-[10.5px] leading-snug text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href={hubHref as any}
        className="group flex items-center gap-3 rounded-[2px] border border-border bg-accent-sage/30 px-4 py-3 transition-colors duration-200 hover:bg-accent-sage/45"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[2px] bg-primary text-primary-foreground">
          <Icon name="RiGridLine" className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[16px] leading-tight text-foreground">
            {t("ai_tools.view_all_cta", { count: total })}
          </span>
          <span className="mt-0.5 block text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            {t("ai_tools.view_all_sub")}
          </span>
        </span>
        <Icon
          name="RiArrowRightSLine"
          className="ml-auto size-4 shrink-0 text-muted-foreground"
        />
      </Link>
    </div>
  );
}
