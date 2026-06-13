"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import {
  RiBookOpenLine,
  RiSparkling2Line,
  RiCloseLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiHashtag,
} from "react-icons/ri";
import { Link } from "@/i18n/navigation";
import StoryCard, { CommunityStory } from "./story-card";

interface SourceCategoryOption {
  key: string;
  value: string | undefined;
  label: string;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
}

interface CommunityGridProps {
  stories: CommunityStory[];
  categoryOptions: SourceCategoryOption[];
  activeCategory?: string;
  activeTag?: string;
  activeTagLabel?: string | null;
  emptyMessage: string;
  untitledLabel: string;
  previewLabel: string;
  filteringByTagLabel: string;
  clearTagFilterLabel: string;
  pageInfoLabel: string;
  prevPageLabel: string;
  nextPageLabel: string;
  pagination: PaginationInfo;
}

function buildHref(opts: {
  tag?: string;
  sourceCategory?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (opts.tag) params.set("tag", opts.tag);
  if (opts.sourceCategory) params.set("sourceCategory", opts.sourceCategory);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return `/community${qs ? `?${qs}` : ""}` as any;
}

export default function CommunityGrid({
  stories,
  categoryOptions,
  activeCategory,
  activeTag,
  activeTagLabel,
  emptyMessage,
  untitledLabel,
  previewLabel,
  filteringByTagLabel,
  clearTagFilterLabel,
  pageInfoLabel,
  prevPageLabel,
  nextPageLabel,
  pagination,
}: CommunityGridProps) {
  const [headerVisible, setHeaderVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHeaderVisible(true), 50);
    const t2 = setTimeout(() => setFilterVisible(true), 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const { page, totalPages } = pagination;

  const categoryNav = useMemo(
    () =>
      categoryOptions.map((option) => {
        const isActive =
          option.value === activeCategory ||
          (!option.value && !activeCategory);
        return { ...option, isActive, href: buildHref({ tag: activeTag, sourceCategory: option.value }) };
      }),
    [categoryOptions, activeCategory, activeTag]
  );

  return (
    <div className="space-y-10 md:space-y-12">
      {/* Header */}
      <div
        className={cn(
          "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          headerVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/15">
            <RiSparkling2Line className="size-5 text-primary" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              <span className="size-1 rounded-full bg-primary/70" />
              Community
            </span>
          </div>
        </div>
      </div>

      {/* Active tag chip */}
      {activeTag && activeTagLabel && (
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/40 bg-black/[0.02] px-1 py-1 pl-3 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-white/[0.02]",
            headerVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          )}
        >
          <RiHashtag className="size-3.5 text-primary/70" />
          <span className="text-xs font-medium text-muted-foreground">
            {filteringByTagLabel.replace("{tag}", activeTagLabel)}
          </span>
          <Link
            href={buildHref({ sourceCategory: activeCategory }) as any}
            className="group/btn flex size-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/70 transition-all duration-300 hover:bg-primary hover:text-primary-foreground active:scale-[0.92]"
            aria-label={clearTagFilterLabel}
          >
            <RiCloseLine className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Source category filter */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          filterVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0"
        )}
      >
        {categoryNav.map((option) => (
          <Link
            key={option.key}
            href={option.href}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]",
              option.isActive
                ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_rgba(0,0,0,0.18)]"
                : "border-border/40 bg-card text-muted-foreground hover:border-border/70 hover:bg-muted/40 hover:text-foreground"
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {/* Stories grid or empty state */}
      {stories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
          {stories.map((story, i) => (
            <StoryCard
              key={story.uuid}
              story={story}
              index={i}
              untitledLabel={untitledLabel}
              previewLabel={previewLabel}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 transition-all duration-700 delay-150 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-white/[0.02]",
            filterVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          )}
        >
          <div className="flex flex-col items-center justify-center rounded-[1.125rem] border border-dashed border-border/40 bg-card py-24">
            <div className="flex size-16 items-center justify-center rounded-[1.25rem] bg-muted/50 ring-1 ring-inset ring-border/40">
              <RiBookOpenLine className="size-7 text-muted-foreground/40" />
            </div>
            <p className="mt-5 max-w-xs text-center text-sm font-medium leading-relaxed text-muted-foreground/60">
              {emptyMessage}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className={cn(
            "flex items-center justify-center gap-2 transition-all duration-700 delay-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            filterVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          )}
        >
          {page > 1 ? (
            <Link
              href={
                page > 2
                  ? (buildHref({
                      tag: activeTag,
                      sourceCategory: activeCategory,
                      page: page - 1,
                    }) as any)
                  : (buildHref({
                      tag: activeTag,
                      sourceCategory: activeCategory,
                    }) as any)
              }
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/70 hover:bg-muted/40 hover:text-foreground active:scale-[0.97]"
            >
              <RiArrowLeftLine className="size-3.5 transition-transform duration-500 group-hover:-translate-x-0.5" />
              {prevPageLabel}
            </Link>
          ) : null}

          <div className="inline-flex items-center rounded-full border border-border/40 bg-card px-4 py-2">
            <span className="text-xs font-medium tabular-nums text-muted-foreground/80">
              {pageInfoLabel
                .replace("{page}", String(page))
                .replace("{totalPages}", String(totalPages))}
            </span>
          </div>

          {page < totalPages ? (
            <Link
              href={
                buildHref({
                  tag: activeTag,
                  sourceCategory: activeCategory,
                  page: page + 1,
                }) as any
              }
              className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-[0_6px_20px_-8px_rgba(0,0,0,0.18)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_10px_28px_-10px_rgba(0,0,0,0.22)] active:scale-[0.97]"
            >
              {nextPageLabel}
              <RiArrowRightLine className="size-3.5 transition-transform duration-500 group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
