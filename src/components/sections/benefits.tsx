"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function Benefits({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  const HIGHLIGHT = "Story Generator";
  const titleParts = section.title?.split(HIGHLIGHT);
  const hasHighlight = titleParts && titleParts.length === 2;

  const [featured, ...rest] = section.items;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.95_0.04_65),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.16_0.02_55),transparent)]" />
        <div
          className="absolute -right-[10%] top-[20%] h-[350px] w-[350px] rounded-full opacity-[0.07] dark:opacity-[0.04]"
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
          className="max-w-2xl"
        >
          {section.label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              <span className={`inline-block size-1.5 rounded-full ${a.solid}`} />
              {section.label}
            </span>
          )}

          {section.title && (
            <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
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
            <p className="text-[1.05rem] leading-relaxed text-muted-foreground/65">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-12">

          {/* ── Featured card (left, 7 cols) ── */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
              className="lg:col-span-7"
            >
              {/* Outer shell */}
              <div className="group h-full rounded-[1.75rem] border border-border/15 bg-foreground/[0.012] p-1.5 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/28 dark:bg-white/[0.015]">
                {/* Inner core */}
                <div className="h-full overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                  {/* Image with zoom effect */}
                  {featured.image?.src && (
                    <div className="relative h-56 overflow-hidden sm:h-64">
                      <img
                        src={featured.image.src}
                        alt={featured.title || ""}
                        className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                      {/* Top reflection */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.05] to-transparent" />
                    </div>
                  )}
                  {/* Content */}
                  <div className="p-6 sm:p-8">
                    {featured.icon && (
                      <div className="mb-5 inline-flex rounded-xl border border-border/15 bg-foreground/[0.02] p-1">
                        <div className={`flex size-9 items-center justify-center rounded-lg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${a.iconBg}`}>
                          <Icon name={featured.icon} className={`size-5 ${a.text}`} />
                        </div>
                      </div>
                    )}
                    <h3 className="text-lg font-bold tracking-tight text-foreground leading-snug">
                      {featured.title}
                    </h3>
                    {featured.description && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground/60">
                        {featured.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Right column: 2 stacked cards (5 cols) ── */}
          {rest.length > 0 && (
            <div className="flex flex-col gap-5 lg:col-span-5">
              {rest.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: (i + 1) * 0.1, ease: [0.32, 0.72, 0, 1] }}
                  className="flex-1"
                >
                  {/* Outer shell */}
                  <div className="group h-full rounded-[1.5rem] border border-border/15 bg-foreground/[0.012] p-1 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/28 dark:bg-white/[0.015]">
                    {/* Inner core */}
                    <div className="h-full overflow-hidden rounded-[calc(1.5rem-0.25rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      {/* Image */}
                      {item.image?.src && (
                        <div className="relative h-36 overflow-hidden">
                          <img
                            src={item.image.src}
                            alt={item.title || ""}
                            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card/75 to-transparent" />
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/[0.04] to-transparent" />
                        </div>
                      )}
                      {/* Content */}
                      <div className="p-5 sm:p-6">
                        {item.icon && (
                          <div className="mb-4 inline-flex rounded-xl border border-border/15 bg-foreground/[0.02] p-0.5">
                            <div className={`flex size-8 items-center justify-center rounded-lg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${a.iconBg}`}>
                              <Icon name={item.icon} className={`size-4 ${a.text}`} />
                            </div>
                          </div>
                        )}
                        <h3 className="text-[0.95rem] font-bold tracking-tight text-foreground leading-snug">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="mt-2 text-[0.825rem] leading-relaxed text-muted-foreground/58 line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
