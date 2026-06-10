"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
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

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr]">
          {/* Left column — sticky heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            {section.label && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
                <span className={`inline-block size-1.5 rounded-full ${a.solid} opacity-60`} />
                {section.label}
              </span>
            )}
            {section.title && (
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground/70">
                {section.description}
              </p>
            )}
          </motion.div>

          {/* Right column — accordion */}
          <div className="space-y-3">
            {section.items.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] }}
                  className={`rounded-2xl border bg-card transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isOpen ? `border-border/40 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.3)]` : "border-border/15"
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center gap-4 px-5 py-4.5 text-left"
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? a.numActive : "bg-foreground/[0.04] text-muted-foreground/50"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-foreground">{item.title}</span>
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "rotate-180" : ""}`}
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" d="M4 6l4 4 4-4" />
                    </svg>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pl-16">
                          <p className="text-sm leading-relaxed text-muted-foreground/60">{item.description}</p>
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
  );
}
