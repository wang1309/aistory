"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import { useState } from "react";
import { AnimatePresence, motion as m } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function FAQ({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          {section.label && (
            <p className={`text-xs font-semibold uppercase tracking-widest ${a.text}`}>
              {section.label}
            </p>
          )}
          {section.title && (
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {section.title}
            </h2>
          )}
          {section.description && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {section.description}
            </p>
          )}
        </div>

        {/* Accordion */}
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {section.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: [0.4, 0, 0.2, 1] }}
                className={`rounded-xl border bg-card transition-colors ${isOpen ? "border-border" : "border-border/60"}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors ${isOpen ? a.numActive : "bg-muted text-muted-foreground"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-foreground">{item.title}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pl-16">
                        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
