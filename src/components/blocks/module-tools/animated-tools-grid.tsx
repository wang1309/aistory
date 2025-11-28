"use client";

import React from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";

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
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
  }
};

export function AnimatedToolsGrid({ tools, badgeCategoryLabel }: AnimatedToolsGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
    >
      {tools.map((tool) => (
        <ToolCard
          key={tool.slug}
          tool={tool}
          badgeCategoryLabel={badgeCategoryLabel}
        />
      ))}
    </motion.div>
  );
}

function ToolCard({ tool, badgeCategoryLabel }: { tool: ToolCardData; badgeCategoryLabel: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      variants={itemVariants}
      className="group h-full"
    >
      <div
        className="relative h-full overflow-hidden rounded-3xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors duration-500 flex flex-col"
        onMouseMove={handleMouseMove}
      >
        {/* Spotlight Gradient */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500 z-10"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                600px circle at ${mouseX}px ${mouseY}px,
                color-mix(in srgb, var(--primary), transparent 94%),
                transparent 40%
              )
            `,
          }}
        />

        <div className="relative z-20 p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 shadow-inner group-hover:scale-110 group-hover:border-primary/30 transition-all duration-500">
                <Icon name={tool.icon} className="w-5 h-5 text-primary/80 group-hover:text-primary transition-colors" />
                {/* Icon Glow */}
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
                  {tool.name}
                </h3>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
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
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border backdrop-blur-sm",
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
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-primary/10 rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-primary/10 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
      </div>
    </motion.div>
  );
}
