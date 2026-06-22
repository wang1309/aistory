"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion, MotionConfig } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import { useState } from "react";
import { AnimatePresence, motion as m } from "framer-motion";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function FAQ({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (section.disabled || !section.items?.length) return null;

  const HIGHLIGHT = "AI Story Generator";
  const titleParts = section.title?.split(HIGHLIGHT);
  const hasHighlight = titleParts && titleParts.length === 2;

  return (
    <MotionConfig reducedMotion="user">
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.95_0.04_65),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.16_0.02_55),transparent)]" />
        <div
          className="absolute -left-[6%] bottom-[8%] h-[350px] w-[350px] rounded-full opacity-[0.07] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr]">

          {/* Left column — sticky heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            {section.label && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                <span className={`inline-block size-1.5 rounded-full ${a.solid} opacity-60`} />
                {section.label}
              </span>
            )}

            {section.title && (
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                {hasHighlight ? (
                  <>
                    {titleParts[0]}
                    <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                      {HIGHLIGHT}
                    </span>
                    {titleParts[1]}
                  </>
                ) : (
                  section.title
                )}
              </h2>
            )}

            {/* Decorative brush stroke */}
            <svg
              className="mt-2 mb-5 h-2.5 w-28 text-primary/25"
              viewBox="0 0 160 12"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M2 8c30-5 60-6 90-3s40 4 66-1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {section.description && (
              <p className="max-w-md text-base leading-relaxed text-muted-foreground/65 font-light">
                {section.description}
              </p>
            )}
          </motion.div>

          {/* Right column — accordion */}
          <div className="space-y-4">
            {section.items.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
                  className={`group relative rounded-[1.25rem] border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isOpen
                      ? "border-border/40 bg-card shadow-[0_2px_20px_-6px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.3)]"
                      : "border-border/15 bg-card/60 hover:border-border/25"
                  }`}
                >
                  {/* Left accent bar — only when open */}
                  <div
                    className={`absolute left-0 top-3 bottom-3 w-px transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isOpen ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ background: "linear-gradient(to bottom, transparent, oklch(0.72 0.16 55 / 0.4), transparent)" }}
                  />

                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full min-h-[44px] items-center gap-3 px-4 py-4 text-left sm:gap-4 sm:px-6 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                  >
                    {/* Double-bezel number badge */}
                    <div className={`shrink-0 rounded-lg border p-0.5 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "border-primary/20" : "border-border/15 bg-foreground/[0.02]"}`}>
                      <span className={`flex size-6 items-center justify-center rounded-md text-[10px] font-semibold tabular-nums transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? a.iconBg + " " + a.text : "bg-foreground/[0.04] text-muted-foreground/50"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <span className="flex-1 text-[0.95rem] font-semibold text-foreground">{item.title}</span>

                    {/* Chevron in circular container */}
                    <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "bg-foreground/[0.06]" : "bg-foreground/[0.03]"}`}>
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className={`size-4 text-muted-foreground/40 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "rotate-180" : ""}`}
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path strokeLinecap="round" d="M4 6l4 4 4-4" />
                      </svg>
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pl-[4.25rem]">
                          <p className="text-sm leading-[1.7] text-muted-foreground/60">{item.description}</p>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
    </MotionConfig>
  );
}
