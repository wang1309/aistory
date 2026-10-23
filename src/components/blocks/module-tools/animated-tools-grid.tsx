"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { getAccent, type AccentColor } from "@/components/sections/accent";
import type { ToolGroup } from "@/services/tools";

interface ToolBadge {
  type: string;
  label: string;
}

export interface ToolCardData {
  slug: string;
  icon: string;
  href: string;
  name: string;
  description: string;
  category: string;
  /** 粗粒度分组,groupedChips 筛选模式依赖此字段。 */
  group?: ToolGroup;
  accent?: AccentColor;
  image?: string;
  badges?: ToolBadge[];
}

export type ToolCardVariant = "media" | "compact";

interface AnimatedToolsGridProps {
  tools: ToolCardData[];
  badgeCategoryLabel?: string;
  accent?: AccentColor;
  className?: string;
  /**
   * media: 封面图/渐变卡(默认,工具目录与相关推荐用);
   * compact: 无图紧凑卡(首页用,零图片请求)。
   */
  variant?: ToolCardVariant;
}

export function AnimatedToolsGrid({
  tools,
  accent = "orange",
  className,
  variant = "media",
}: AnimatedToolsGridProps) {
  return (
    <div
      className={cn(
        variant === "compact"
          ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4",
        className ?? "mt-16"
      )}
    >
      {tools.map((tool, i) => (
        <motion.div
          key={tool.slug}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, delay: Math.min(i, 5) * 0.07, ease: [0.32, 0.72, 0, 1] }}
        >
          {variant === "compact" ? (
            <CompactToolCard
              tool={tool}
              accent={accent}
            />
          ) : (
            <ToolCard
              tool={tool}
              accent={accent}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function CardBadges({ tool }: { tool: ToolCardData }) {
  if (!tool.badges || tool.badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tool.badges.map((badge) => (
        <span
          key={badge.label}
          className={cn(
            "rounded-[2px] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider",
            badge.type === "hot"
              ? "bg-accent-rose text-accent-copper"
              : "bg-accent-sage text-primary"
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function ArrowAffordance() {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
        "transition-all duration-300",
        "bg-accent-sage text-accent-copper group-hover:translate-x-0.5 group-hover:-translate-y-px"
      )}
    >
      <svg viewBox="0 0 16 16" className="size-3 text-muted-foreground/35 transition-colors duration-300 group-hover:text-foreground/60" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" d="M5 3l6 5-6 5" />
      </svg>
    </span>
  );
}

function CompactToolCard({
  tool,
  accent,
}: {
  tool: ToolCardData;
  accent: AccentColor;
}) {
  // Per-tool accent (tool-directory identity) wins; section accent is the fallback.
  const a = getAccent(tool.accent ?? accent);

  return (
    <Link
      href={tool.href}
      className={cn(
        "group flex h-full flex-col rounded-[2px] p-4",
        "border border-border bg-card shadow-[4px_4px_0_rgba(36,77,61,0.06)]",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/30 hover:shadow-[6px_6px_0_rgba(36,77,61,0.08)]",
        "dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Accent icon tile — replaces the media cover as the card's identity */}
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            "transition-transform duration-300 group-hover:scale-[1.06]",
            a.iconBg
          )}
        >
          <Icon name={tool.icon} className={cn("size-5", a.text)} />
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-display text-[17px] font-normal leading-snug tracking-[-0.01em] text-foreground">
            {tool.name}
          </h3>
          <CardBadges tool={tool} />
        </div>

        <ArrowAffordance />
      </div>

      {tool.description && (
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2">
          {tool.description}
        </p>
      )}
    </Link>
  );
}

function ToolCard({
  tool,
  accent,
}: {
  tool: ToolCardData;
  accent: AccentColor;
}) {
  // Per-tool accent (tool-directory identity) wins; section accent is the fallback.
  const a = getAccent(tool.accent ?? accent);

  return (
    <Link
      href={tool.href}
      className={cn(
        "group flex h-full flex-col",
        "rounded-[2px]",
        // 双壳卡(外壳 4px 缝)只用于渐变封面;真实图片封面须贴满,
        // 否则图片两侧会露出缝
        tool.image ? "p-0" : "p-[6px]",
        "border border-border bg-card shadow-[5px_7px_0_rgba(36,77,61,0.07)]",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/30 hover:shadow-[7px_9px_0_rgba(36,77,61,0.09)]",
        "dark:shadow-[5px_7px_0_rgba(0,0,0,0.45)]"
      )}
    >
      {/* Inner core */}
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden bg-card",
          tool.image ? "rounded-[2px]" : "rounded-[1px]"
        )}
      >
        {/* Cover */}
        <div
          aria-hidden="true"
          className={cn(
            "relative aspect-[16/9] w-full shrink-0 overflow-hidden",
            !tool.image && a.cover
          )}
        >
          {tool.image ? (
            <Image
              src={tool.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <>
              {/* Soft hue glow */}
              <div
                className={cn(
                  "absolute -left-8 -top-10 size-32 rounded-full blur-3xl",
                  a.iconBg
                )}
              />
              {/* Dot-grid texture */}
              <div className="absolute right-0 top-0 h-12 w-20 text-foreground/[0.05] [background-image:radial-gradient(circle_at_center,currentColor_0.8px,transparent_0.8px)] [background-size:10px_10px] dark:text-white/[0.07]" />
              {/* Oversized watermark glyph, cropped by the cover edge */}
              <Icon
                name={tool.icon}
                className={cn(
                  "absolute -bottom-4 -right-3 size-20 rotate-[10deg] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-[5deg] group-hover:scale-[1.06]",
                  a.coverGlyph
                )}
              />
            </>
          )}
        </div>

        {/* Text zone */}
        <div className="flex flex-1 flex-col px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-display text-[19px] font-normal tracking-[-0.01em] leading-snug text-foreground">
                {tool.name}
              </h3>
              <CardBadges tool={tool} />
            </div>
            {/* Arrow affordance */}
            <span className="mt-0.5">
              <ArrowAffordance />
            </span>
          </div>

          {tool.description && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2">
              {tool.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
