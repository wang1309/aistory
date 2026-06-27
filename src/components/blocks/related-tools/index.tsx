import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { tools as allTools, type Tool } from "@/services/tools";
import { type AccentColor } from "@/components/sections/accent";
import { cn } from "@/lib/utils";
import {
  RelatedToolsGrid,
  type RelatedToolCard,
} from "./related-tools-grid";

interface RelatedToolsProps {
  /** Slug of the current page's tool (excluded from results). */
  currentSlug: string;
  /** Optional hand-picked slugs, shown in the given order when present. */
  relatedSlugs?: string[];
  /** Number of related tools to show. Defaults to 4. */
  limit?: number;
  title: string;
  description?: string;
  eyebrow?: string;
  ctaLabel?: string;
  /** Absolute path of the "see all" target, e.g. "/ai-write-tool". */
  moreHref?: string;
  moreLabel?: string;
  accent?: AccentColor;
}

/**
 * Pick related tools. Prefer an explicit `relatedSlugs` list (curated by the
 * page); otherwise fall back to a category → tab → module scoring rubric so
 * every tool page gets a sensible default set.
 */
function resolveRelated(
  currentSlug: string,
  relatedSlugs?: string[],
  limit = 4
): Tool[] {
  if (relatedSlugs?.length) {
    const picked: Tool[] = [];
    for (const slug of relatedSlugs) {
      const tool = allTools.find((t) => t.slug === slug);
      if (tool && tool.slug !== currentSlug) picked.push(tool);
      if (picked.length >= limit) break;
    }
    if (picked.length) return picked;
  }

  const current = allTools.find((t) => t.slug === currentSlug);
  if (!current) return [];

  const scored = allTools
    .filter((t) => t.slug !== currentSlug)
    .map((t) => ({
      tool: t,
      score:
        (t.category === current.category ? 3 : 0) +
        (t.tab && t.tab === current.tab ? 2 : 0) +
        (t.module === current.module ? 1 : 0),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || (b.tool.priority ?? 0) - (a.tool.priority ?? 0)
    );

  return scored.slice(0, limit).map((s) => s.tool);
}

export default async function RelatedTools({
  currentSlug,
  relatedSlugs,
  limit = 4,
  title,
  description,
  eyebrow,
  ctaLabel,
  moreHref,
  moreLabel,
  accent = "orange",
}: RelatedToolsProps) {
  const t = await getTranslations();
  const related = resolveRelated(currentSlug, relatedSlugs, limit);
  if (!related.length) return null;

  const cards: RelatedToolCard[] = related.map((tool) => ({
    slug: tool.slug,
    icon: tool.icon,
    href: tool.href,
    name: t(tool.nameKey),
    description: t(tool.shortDescKey),
  }));

  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-primary opacity-60" />
              {eyebrow}
            </span>
          )}
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          {description && (
            <p className="mx-auto mt-3 max-w-md text-center font-light text-sm leading-relaxed text-muted-foreground/65 sm:text-base">
              {description}
            </p>
          )}
        </div>

        <RelatedToolsGrid tools={cards} ctaLabel={ctaLabel} accent={accent} />

        {moreHref && moreLabel && (
          <div className="mt-8 flex justify-center">
            <a
              href={moreHref}
              className={cn(
                "group inline-flex items-center gap-2.5 rounded-full",
                "border border-border/20 bg-background/80 px-5 py-2.5",
                "text-sm font-medium text-foreground",
                "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                "hover:border-border/40 hover:bg-foreground/[0.02]",
                "active:scale-[0.98]",
                "dark:hover:bg-white/[0.02]"
              )}
            >
              {moreLabel}
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  "bg-foreground/[0.05] text-muted-foreground",
                  "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  "group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105",
                  "dark:bg-white/[0.08]"
                )}
              >
                <ArrowUpRight className="size-3.5" />
              </span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
