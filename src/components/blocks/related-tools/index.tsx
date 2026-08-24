import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { tools as allTools, type Tool } from "@/services/tools";
import { Link } from "@/i18n/navigation";
import { type AccentColor } from "@/components/sections/accent";
import { cn } from "@/lib/utils";
import { RandomToolsGrid } from "@/components/blocks/related-tools/random-tools-grid";
import type { ToolCardData } from "@/components/blocks/module-tools/animated-tools-grid";

interface RelatedToolsProps {
  /** Slug of the current page's tool (excluded from results). */
  currentSlug: string;
  /** Optional hand-picked slugs, seeded at the head of the candidate pool. */
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
 * Build the candidate pool for related tools: hand-picked slugs first, then
 * tools ranked by category → tab → module affinity, then the rest by
 * priority. The caller samples `limit` entries from this pool at random on
 * the client (see RandomToolsGrid), so every visit can surface a different
 * mix while never leaving the relevant set.
 */
function resolveRelatedPool(
  currentSlug: string,
  relatedSlugs?: string[]
): Tool[] {
  const pool: Tool[] = [];
  const seen = new Set<string>([currentSlug]);

  if (relatedSlugs?.length) {
    for (const slug of relatedSlugs) {
      const tool = allTools.find((t) => t.slug === slug);
      if (tool && !seen.has(tool.slug)) {
        pool.push(tool);
        seen.add(tool.slug);
      }
    }
  }

  const current = allTools.find((t) => t.slug === currentSlug);
  const rest =
    !current
      ? []
      : allTools
          .filter((t) => !seen.has(t.slug))
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
          )
          .map((s) => s.tool);

  return [...pool, ...rest];
}

export default async function RelatedTools({
  currentSlug,
  relatedSlugs,
  limit = 4,
  title,
  description,
  eyebrow,
  moreHref,
  moreLabel,
  accent = "orange",
}: RelatedToolsProps) {
  const t = await getTranslations();
  const pool = resolveRelatedPool(currentSlug, relatedSlugs);
  if (!pool.length) return null;

  // 与工具目录(module-tools)同一套媒体卡:封面图 + 标题 + 描述。
  const cards: ToolCardData[] = pool.map((tool) => ({
    slug: tool.slug,
    icon: tool.icon,
    href: tool.href,
    name: t(tool.nameKey),
    description: t(tool.shortDescKey),
    category: tool.category,
    accent: tool.accent,
    image: tool.image,
  }));

  return (
    <section className="relative py-20 sm:py-24" data-nosnippet>
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

        <RandomToolsGrid
          tools={cards}
          limit={limit}
          accent={accent}
          className="mt-10"
        />

        {moreHref && moreLabel && (
          <div className="mt-8 flex justify-center">
            <Link
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
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
