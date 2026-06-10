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
    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {tools.map((tool, i) => (
        <motion.div
          key={tool.slug}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
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
        "card-hover-lift group flex h-full flex-col rounded-xl border border-border bg-card p-5 sm:p-6 transition-colors",
        a.hoverBorder,
        a.hoverBg,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", a.iconBg)}>
            <Icon name={tool.icon} className={cn("h-5 w-5", a.text)} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{tool.name}</h3>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mt-0.5">
              {badgeCategoryLabel}
            </p>
          </div>
        </div>

        {tool.badges && tool.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tool.badges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border",
                  badge.type === "hot"
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-teal-500/10 text-teal-500 border-teal-500/20"
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {tool.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      )}
    </a>
  );
}
