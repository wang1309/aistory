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
  badges?: ToolBadge[];
}

interface AnimatedToolsGridProps {
  tools: ToolCardData[];
  badgeCategoryLabel: string;
  accent?: AccentColor;
}

export function AnimatedToolsGrid({ tools, badgeCategoryLabel, accent = "orange" }: AnimatedToolsGridProps) {
  return (
    <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {tools.map((tool, i) => (
        <motion.div
          key={tool.slug}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: [0.32, 0.72, 0, 1] }}
        >
          <ToolCard tool={tool} badgeCategoryLabel={badgeCategoryLabel} accent={accent} />
        </motion.div>
      ))}
    </div>
  );
}

function ToolCard({ tool, badgeCategoryLabel, accent }: { tool: ToolCardData; badgeCategoryLabel: string; accent: AccentColor }) {
  const a = getAccent(accent);

  return (
    <a
      href={tool.href}
      className={cn(
        "group flex h-full flex-col",
        "rounded-[1.25rem] border border-border/15 bg-foreground/[0.015] p-1.5",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:border-border/35 hover:bg-foreground/[0.025]",
        "dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
      )}
    >
      {/* Inner core */}
      <div className="flex h-full flex-col rounded-[calc(1.25rem-0.375rem)] bg-card px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", a.iconBg, "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110")}>
              <Icon name={tool.icon} className={cn("h-4.5 w-4.5", a.text)} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{tool.name}</h3>
              <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mt-0.5">
                {badgeCategoryLabel}
              </p>
            </div>
          </div>

          {tool.badges && tool.badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tool.badges.map((badge) => (
                <span
                  key={badge.label}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                    badge.type === "hot"
                      ? "bg-red-500/8 text-red-500/70"
                      : "bg-teal-500/8 text-teal-500/70"
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {tool.description && (
          <p className="text-sm leading-relaxed text-muted-foreground/55">{tool.description}</p>
        )}

        {/* Subtle arrow on hover */}
        <div className="mt-auto pt-4 flex items-center justify-end">
          <span className={cn(
            "inline-flex size-6 items-center justify-center rounded-full opacity-0 translate-x-1",
            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "group-hover:opacity-100 group-hover:translate-x-0",
            a.iconBg
          )}>
            <svg viewBox="0 0 16 16" className={cn("h-3 w-3", a.text)} fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M6 3l5 5-5 5" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}
