"use client";

import { Link } from "@/i18n/navigation";
import { Section as SectionType } from "@/types/blocks/section";
import OptimizedImage from "@/components/seo/optimized-image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Showcase({ section }: { section: SectionType }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  if (section.disabled) return null;

  return (
    <section
      ref={containerRef}
      id={section.name || "story_showcase"}
      className="relative py-28 lg:py-36 overflow-hidden"
    >
      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          style={{ opacity }}
          className="mx-auto flex max-w-xl flex-col items-center gap-4 mb-16 text-center"
        >
          {section.label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
              {section.label}
            </span>
          )}
          {section.title && (
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl leading-[1.1]">
              {section.title}
            </h2>
          )}
          {section.description && (
            <p className="max-w-md text-base text-muted-foreground/70 leading-relaxed font-light">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {section.items?.map((item, index) => (
            <ShowcaseCard key={index} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({ item, index }: { item: any; index: number }) {
  return (
    <Link href={item.url || ""} target={item.target} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="group h-full"
      >
        {/* Outer bezel */}
        <div className="h-full rounded-[1.25rem] border border-border/15 bg-foreground/[0.015] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/35 dark:bg-white/[0.02]">
          {/* Inner core */}
          <div className="overflow-hidden rounded-[calc(1.25rem-0.375rem)] bg-card flex flex-col h-full">
            {/* Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <OptimizedImage
                src={item.image?.src || ""}
                alt={item.image?.alt || item.title || "Example"}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
              />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-[0.95rem] font-semibold text-foreground tracking-tight line-clamp-1">
                  {item.title}
                </h3>
                <span className="inline-flex size-6 shrink-0 mt-0.5 items-center justify-center rounded-full bg-foreground/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-foreground/[0.08] group-hover:translate-x-0.5">
                  <svg viewBox="0 0 16 16" className="h-3 w-3 text-muted-foreground/50" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M5 3l6 5-6 5" />
                  </svg>
                </span>
              </div>
              <p className="text-sm text-muted-foreground/55 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
