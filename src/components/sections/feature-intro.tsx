"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function FeatureIntro({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_340px]">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            {section.label && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground backdrop-blur-sm">
                <span className={`inline-block size-1.5 rounded-full ${a.solid} opacity-60`} />
                {section.label}
              </span>
            )}
            {section.title && (
              <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground/70 sm:text-[1.05rem]">
                {section.description}
              </p>
            )}

            <ul className="mt-10 space-y-6">
              {section.items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
                  className="group flex items-start gap-4"
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/20 bg-card transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-transparent ${a.iconBg}`}>
                    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-colors duration-500 ${a.text}`} fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" d="M4 8.5l3 3 5-6" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[0.95rem] font-semibold text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/65">{item.description}</p>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Decorative stacked cards */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="relative"
            >
              {/* Card 1 */}
              <div className="absolute -left-3 -top-3 h-[140px] w-[140px] rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.3)]" style={{ transform: "rotate(-3deg)" }} />
              {/* Card 2 */}
              <div className="absolute -bottom-3 -right-3 h-[140px] w-[140px] rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.3)]" style={{ transform: "rotate(2deg)" }} />
              {/* Center card */}
              <div className={`relative h-[160px] w-[160px] rounded-2xl border ${a.border} bg-card shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] flex items-center justify-center`}>
                <div className="grid grid-cols-2 gap-2 opacity-20">
                  <div className={`h-10 w-10 rounded-lg ${a.solid}`} />
                  <div className="h-6 w-10 rounded-lg bg-foreground/8" />
                  <div className="h-6 w-10 rounded-lg bg-foreground/8" />
                  <div className={`h-10 w-10 rounded-lg ${a.solid}`} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
