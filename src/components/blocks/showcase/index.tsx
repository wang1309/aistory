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

  // Split title to highlight "AI"
  const HIGHLIGHT = "AI";
  const titleParts = section.title?.split(new RegExp(`(${HIGHLIGHT})`, "g"));

  return (
    <section
      ref={containerRef}
      id={section.name || "story_showcase"}
      className="relative py-28 lg:py-36 overflow-hidden"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.96_0.03_65),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.15_0.02_55),transparent)]" />
        <div
          className="absolute -left-[8%] bottom-[5%] h-[350px] w-[350px] rounded-full opacity-[0.07] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          style={{ opacity }}
          className="mx-auto flex max-w-xl flex-col items-center gap-0 mb-16 text-center"
        >
          {section.label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
              <span className="inline-block size-1.5 rounded-full bg-primary opacity-60" />
              {section.label}
            </span>
          )}
          {section.title && (
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl leading-[1.1]">
              {titleParts?.map((part, i) =>
                part === HIGHLIGHT ? (
                  <span key={i} className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    {part}
                  </span>
                ) : (
                  part
                )
              ) ?? section.title}
            </h2>
          )}

          {/* Decorative brush stroke */}
          <div className="flex justify-center">
            <svg
              className="mt-2 mb-5 h-2.5 w-28 text-primary/25"
              viewBox="0 0 160 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8c30-5 60-6 90-3s40 4 66-1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {section.description && (
            <p className="max-w-md text-base text-muted-foreground/65 leading-relaxed font-light">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Asymmetric bento grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items?.map((item, index) => (
            <ShowcaseCard key={index} item={item} index={index} featured={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({
  item,
  index,
  featured,
}: {
  item: any;
  index: number;
  featured?: boolean;
}) {
  return (
    <Link
      href={item.url || ""}
      target={item.target}
      className={`block h-full ${featured ? "sm:col-span-2 lg:col-span-2" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: featured ? 0.97 : 1 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.07, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="group h-full"
      >
        {/* Outer shell */}
        <div className={`h-full border border-border/15 bg-foreground/[0.012] transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/30 dark:bg-white/[0.015] ${featured ? "rounded-[1.75rem] p-1.5" : "rounded-[1.5rem] p-1"}`}>
          {/* Inner core */}
          <div className={`overflow-hidden bg-card flex flex-col h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${featured ? "rounded-[calc(1.75rem-0.375rem)]" : "rounded-[calc(1.5rem-0.25rem)]"}`}>
            {/* Image */}
            <div className={`relative w-full overflow-hidden ${featured ? "aspect-[16/8]" : "aspect-[4/3]"}`}>
              <OptimizedImage
                src={item.image?.src || ""}
                alt={item.image?.alt || item.title || "Example"}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
              />

              {/* Genre badge */}
              {item.label && (
                <span className="absolute top-3 left-3 z-10 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90">
                  {item.label}
                </span>
              )}

              {/* Subtle hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-card/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100" />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 px-5 pt-5 pb-5">
              <h3 className={`font-bold tracking-tight text-foreground leading-snug ${featured ? "text-base" : "text-[0.95rem]"} line-clamp-2`}>
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground/55 leading-relaxed line-clamp-2 flex-1">
                {item.description}
              </p>

              {/* Bottom CTA row */}
              <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground/50 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-foreground/70">
                  Read Story
                </span>
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-foreground/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-foreground/[0.09] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <svg viewBox="0 0 16 16" className="h-3 w-3 text-muted-foreground/40 transition-colors duration-300 group-hover:text-foreground/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M5 3l6 5-6 5" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
