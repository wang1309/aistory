"use client";

import React from "react";
import { motion } from "framer-motion";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { getAccent, type AccentColor } from "@/components/sections/accent";

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
  badges?: ToolBadge[];
}

interface AnimatedToolsGridProps {
  tools: ToolCardData[];
  badgeCategoryLabel: string;
  accent?: AccentColor;
}

export function AnimatedToolsGrid({ tools, badgeCategoryLabel, accent = "orange" }: AnimatedToolsGridProps) {
  return (
    <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {tools.map((tool, i) => (
        <motion.div
          key={tool.slug}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, delay: Math.min(i, 5) * 0.07, ease: [0.32, 0.72, 0, 1] }}
        >
          <ToolCard
            tool={tool}
            badgeCategoryLabel={badgeCategoryLabel}
            accent={accent}
          />
        </motion.div>
      ))}
    </div>
  );
}

function ToolCard({
  tool,
  badgeCategoryLabel,
  accent,
}: {
  tool: ToolCardData;
  badgeCategoryLabel: string;
  accent: AccentColor;
}) {
  const a = getAccent(accent);

  return (
    <a
      href={tool.href}
      className={cn(
        "group flex h-full flex-col",
        "rounded-[1.5rem] p-1",
        "border border-border/15 bg-foreground/[0.012]",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:border-border/30 hover:bg-foreground/[0.02]",
        "dark:bg-white/[0.015] dark:hover:bg-white/[0.025]"
      )}
    >
      {/* Inner core */}
      <div className="flex h-full flex-col rounded-[calc(1.5rem-0.25rem)] bg-card px-5 py-5 sm:px-6 sm:py-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        {/* Top row: icon + name + badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Double-bezel icon container */}
            <div className="shrink-0 rounded-xl border border-border/15 bg-foreground/[0.02] p-0.5">
              <div className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110",
                a.iconBg
              )}>
                <Icon name={tool.icon} className={cn("size-4", a.text)} />
              </div>
            </div>
            <div>
              <h3 className="text-[0.95rem] font-bold tracking-tight text-foreground leading-snug">
                {tool.name}
              </h3>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/35 mt-0.5">
                {badgeCategoryLabel}
              </p>
            </div>
          </div>

          {/* Badges */}
          {tool.badges && tool.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 shrink-0 ml-2">
              {tool.badges.map((badge) => (
                <span
                  key={badge.label}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                    badge.type === "hot"
                      ? "bg-red-500/[0.08] text-red-500/70"
                      : "bg-teal-500/[0.08] text-teal-500/70"
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {tool.description && (
          <p className="text-sm leading-relaxed text-muted-foreground/55 flex-1 line-clamp-2">
            {tool.description}
          </p>
        )}

        {/* Bottom CTA row — arrow in circle */}
        <div className="mt-auto pt-4 border-t border-border/10 flex items-center justify-between">
          <span className={cn(
            "text-xs font-semibold transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "text-muted-foreground/40 group-hover:text-foreground/70"
          )}>
            Try Now
          </span>
          <span className={cn(
            "inline-flex items-center justify-center rounded-full",
            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "size-7 bg-foreground/[0.03] group-hover:bg-foreground/[0.07] group-hover:translate-x-0.5 group-hover:-translate-y-px"
          )}>
            <svg viewBox="0 0 16 16" className="size-3.5 text-muted-foreground/35 transition-colors duration-300 group-hover:text-foreground/60" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M5 3l6 5-6 5" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}
