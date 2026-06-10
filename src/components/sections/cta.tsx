"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function CTA({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled) return null;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Subtle tint */}
      <div className={`absolute inset-0 ${a.sectionBg}`} />

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          {section.title && (
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {section.title}
            </h2>
          )}
          {section.description && (
            <p className="mt-5 text-base leading-relaxed text-muted-foreground/70">
              {section.description}
            </p>
          )}
          {section.buttons && section.buttons.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {section.buttons.map((btn, i) => {
                const isPrimary = i === 0;
                return (
                  <Link
                    key={i}
                    href={btn.url || "#"}
                    target={btn.target || undefined}
                    className={cn(
                      "group inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold active:scale-[0.97]",
                      "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      isPrimary
                        ? `${a.solid} text-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.2)]`
                        : "border border-border/30 bg-card text-foreground hover:border-border/60"
                    )}
                  >
                    {btn.icon && (
                      <Icon name={btn.icon} className="h-4 w-4 opacity-70" />
                    )}
                    {btn.title}
                    {isPrimary && (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px]">
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" d="M6 3l5 5-5 5" />
                        </svg>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
