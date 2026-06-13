"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function UseCases({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  const HIGHLIGHT = "AI Story Generators";
  const titleParts = section.title?.split(HIGHLIGHT);
  const hasHighlight = titleParts && titleParts.length === 2;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Layered background — replaces flat a.sectionBg */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(0.95_0.04_65),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(0.16_0.025_55),transparent)]" />
        <div
          className="absolute -left-[8%] bottom-[5%] h-[380px] w-[380px] rounded-full opacity-[0.08] dark:opacity-[0.05]"
          style={{ background: "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-[5%] top-[15%] h-[280px] w-[280px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.88 0.04 45) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">

        {/* Centered header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="mx-auto max-w-xl text-center"
        >
          {section.label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              <span className={`inline-block size-1.5 rounded-full ${a.solid}`} />
              {section.label}
            </span>
          )}

          {section.title && (
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:leading-[1.15]">
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
              aria-hidden="true"
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
            <p className="text-base leading-relaxed text-muted-foreground/65 max-w-lg mx-auto">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Equal 3-column grid */}
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {section.items.map((item, i) => {
            const isFeatured = i === 0;
            const indexLabel = String(i + 1).padStart(2, "0");

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Outer shell */}
                <div className="group h-full rounded-[1.75rem] border border-border/15 bg-foreground/[0.012] p-1.5 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/28 dark:bg-white/[0.015]">
                  {/* Inner core */}
                  <div className="relative h-full overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-card flex flex-col px-6 py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">

                    {/* Top accent gradient line — only on featured card */}
                    {isFeatured && (
                      <div
                        className="absolute inset-x-0 top-0 h-px"
                        style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 55 / 0.55), transparent)" }}
                      />
                    )}

                    {/* Large decorative index number */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute bottom-3 right-4 text-[5.5rem] font-black leading-none text-foreground/[0.03] dark:text-foreground/[0.04]"
                    >
                      {indexLabel}
                    </span>

                    {/* Double-bezel icon */}
                    {item.icon && (
                      <div className="mb-5 inline-flex rounded-xl border border-border/15 bg-foreground/[0.02] p-1 self-start">
                        <div className={`flex size-9 items-center justify-center rounded-lg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${a.iconBg}`}>
                          <Icon name={item.icon} className={`size-5 ${a.text}`} />
                        </div>
                      </div>
                    )}

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
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
