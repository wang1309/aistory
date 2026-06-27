"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { getAccent, type AccentColor } from "@/components/sections/accent";

export interface RelatedToolCard {
  slug: string;
  icon: string;
  href: string;
  name: string;
  description: string;
}

interface RelatedToolsGridProps {
  tools: RelatedToolCard[];
  ctaLabel?: string;
  accent?: AccentColor;
}

const EASE = [0.32, 0.72, 0, 1] as const;

export function RelatedToolsGrid({
  tools,
  ctaLabel,
  accent = "orange",
}: RelatedToolsGridProps) {
  const a = getAccent(accent);

  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool, i) => (
        <motion.a
          key={tool.slug}
          href={tool.href}
          aria-label={ctaLabel ? `${ctaLabel}: ${tool.name}` : tool.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: Math.min(i, 5) * 0.07, ease: EASE }}
          className={cn(
            "group relative flex items-center",
            "rounded-[1.5rem] p-1.5",
            "border border-border/15 bg-foreground/[0.012]",
            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "hover:-translate-y-0.5 hover:border-border/30 hover:bg-foreground/[0.02]",
            "dark:bg-white/[0.015] dark:hover:bg-white/[0.025]"
          )}
        >
          {/* Inner core */}
          <div className="flex flex-1 items-center gap-4 rounded-[calc(1.5rem-0.375rem)] bg-card px-4 py-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] sm:px-5">
            {/* Double-bezel icon */}
            <div className="shrink-0 rounded-xl border border-border/15 bg-foreground/[0.02] p-0.5">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110",
                  a.iconBg
                )}
              >
                <Icon name={tool.icon} className={cn("size-4", a.text)} />
              </div>
            </div>

            {/* Name + description */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
                {tool.name}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/70">
                {tool.description}
              </p>
            </div>

            {/* Arrow island — appears on hover */}
            <div
              aria-hidden="true"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                "bg-foreground/[0.04] text-muted-foreground",
                "translate-x-1 opacity-0",
                "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                "group-hover:translate-x-0 group-hover:opacity-100",
                "group-hover:-translate-y-px group-hover:bg-foreground/[0.06]",
                "dark:bg-white/[0.06] dark:group-hover:bg-white/[0.1]"
              )}
            >
              <ArrowUpRight className="size-4" />
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
}
