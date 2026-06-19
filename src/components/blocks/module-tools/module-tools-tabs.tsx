"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { AnimatedToolsGrid, type ToolCardData } from "./animated-tools-grid";
import type { AccentColor } from "@/components/sections/accent";

export interface ToolTabData {
  id: string;
  label: string;
  icon?: string;
  tools: ToolCardData[];
}

interface ModuleToolsTabsProps {
  tabs: ToolTabData[];
  badgeCategoryLabel: string;
  accent?: AccentColor;
}

export function ModuleToolsTabs({
  tabs,
  badgeCategoryLabel,
  accent = "orange",
}: ModuleToolsTabsProps) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  if (!active) return null;

  return (
    <div className="mt-12">
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Tool categories"
          className="inline-flex items-center gap-1 rounded-full border border-border/20 bg-background/70 p-1 shadow-[0_8px_30px_-12px_rgba(38,28,12,0.18)] backdrop-blur-md dark:border-white/10"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === active.id;
            const count = tab.tools.length;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(tab.id)}
                className={cn(
                  "group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:px-5 sm:py-2.5 sm:text-sm",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground/70 hover:text-foreground/80"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="module-tools-tab-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary/15 via-primary/10 to-primary/[0.04] ring-1 ring-primary/25 transition-shadow duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {tab.icon && (
                  <Icon
                    name={tab.icon}
                    className={cn(
                      "size-4 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground/60 group-hover:text-foreground/70"
                    )}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "ml-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
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
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        >
          <AnimatedToolsGrid
            tools={active.tools}
            badgeCategoryLabel={badgeCategoryLabel}
            accent={accent}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
