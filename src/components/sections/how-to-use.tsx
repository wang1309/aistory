"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion, MotionConfig } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function HowToUse({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  const HIGHLIGHT = "AI Story Generators";
  const titleParts = section.title?.split(HIGHLIGHT);
  const hasHighlight = titleParts && titleParts.length === 2;

  return (
    <MotionConfig reducedMotion="user">
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Layered background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,oklch(0.96_0.035_65),transparent)] dark:bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,oklch(0.15_0.02_55),transparent)]" />
        <div
          className="absolute -right-[6%] top-[15%] h-[320px] w-[320px] rounded-full opacity-[0.07] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -left-[5%] bottom-[10%] h-[280px] w-[280px] rounded-full opacity-[0.06] dark:opacity-[0.035]"
          style={{ background: "radial-gradient(circle, oklch(0.88 0.04 80) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="mx-auto max-w-xl text-center"
        >
          {section.label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              <span className={`inline-block size-1.5 rounded-full ${a.solid} opacity-60`} />
              {section.label}
            </span>
          )}

          {section.title && (
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl leading-[1.1]">
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
            <p className="max-w-lg mx-auto text-base leading-relaxed text-muted-foreground/65 font-light">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Steps pipeline */}
        <div className="relative mt-20">
          {/* Horizontal connecting line (desktop only) */}
          <div className="absolute top-[3.5rem] left-[16.67%] right-[16.67%] hidden h-px bg-gradient-to-r from-border/10 via-border/20 to-border/10 sm:block" />

          <div className="grid gap-8 md:grid-cols-3 lg:gap-6">
            {section.items.slice(0, 3).map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, delay: i * 0.12, ease: [0.32, 0.72, 0, 1] }}
                className="group relative flex flex-col items-center text-center"
              >
                {/* Step node — icon inside double-bezel circle */}
                <div className="relative z-10 mb-8">
                  {/* Ambient glow behind node */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-20 rounded-full opacity-20 dark:opacity-10 transition-opacity duration-500 group-hover:opacity-30"
                    style={{ background: `radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)` }}
                  />

                  {/* Outer shell */}
                  <div className="relative rounded-full border border-border/15 bg-foreground/[0.012] p-1.5 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.04)] dark:bg-white/[0.015] dark:shadow-[0_2px_20px_-8px_rgba(0,0,0,0.2)]">
                    {/* Inner core */}
                    <div className={`flex size-14 items-center justify-center rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${a.iconBg}`}>
                      <div className={a.text}>
                        {item.icon ? (
                          <Icon name={item.icon} className="size-5" />
                        ) : (
                          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" d="M4 8.5l3 3 5-6" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step number badge — small pill below node */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                    <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${i === 0 ? "border-primary/20 bg-primary/[0.06] text-primary" : "border-border/15 bg-card text-muted-foreground/50"}`}>
                      Step {i + 1}
                    </span>
                  </div>
                </div>

                {/* Step card — double bezel */}
                <div className="w-full">
                  {/* Outer shell */}
                  <div className="rounded-[1.5rem] border border-border/15 bg-foreground/[0.012] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-border/28 dark:bg-white/[0.015]">
                    {/* Inner core */}
                    <div className="rounded-[calc(1.5rem-0.375rem)] bg-card px-6 py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      {/* Large decorative index */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none select-none absolute top-4 right-5 text-[5rem] font-black leading-none text-foreground/[0.025] dark:text-foreground/[0.035]"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <h3 className="text-[0.95rem] font-bold tracking-tight text-foreground leading-snug">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground/60">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
    </MotionConfig>
  );
}
