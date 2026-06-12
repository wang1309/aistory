"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function FeatureIntro({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  // Split title to highlight "AI Story Generator"
  const HIGHLIGHT = "AI Story Generator";
  const titleParts = section.title?.split(HIGHLIGHT);
  const hasHighlight = titleParts && titleParts.length === 2;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Ambient background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full opacity-[0.08] dark:opacity-[0.05]"
          style={{ background: "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)" }} />
        <div className="absolute -right-[5%] top-[10%] h-[320px] w-[320px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.88 0.04 80) 0%, transparent 70%)" }} />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] items-center">

          {/* ── Left: Text content ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Eyebrow badge */}
            {section.label && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                <span className={`inline-block size-1.5 rounded-full ${a.solid}`} />
                {section.label}
              </span>
            )}

            {/* Title with gradient highlight */}
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
              className="mt-2 mb-6 h-2.5 w-32 text-primary/25"
              viewBox="0 0 160 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8c30-5 60-6 90-3s40 4 66-1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Description */}
            {section.description && (
              <p className="max-w-lg text-[1.05rem] leading-[1.8] text-muted-foreground/70">
                {section.description}
              </p>
            )}

            {/* Divider */}
            <div className="mt-8 mb-8 h-px w-full bg-gradient-to-r from-border/30 via-border/15 to-transparent" />

            {/* Feature list */}
            <ul className="space-y-6">
              {section.items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.55, delay: i * 0.12, ease: [0.32, 0.72, 0, 1] }}
                  className="group flex items-start gap-4"
                >
                  {/* Double-bezel icon container */}
                  <div className="mt-0.5 shrink-0 rounded-2xl border border-border/15 bg-foreground/[0.02] p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-primary/20">
                    <div className={`flex size-9 items-center justify-center rounded-xl transition-all duration-500 ${a.iconBg} group-hover:scale-110`}>
                      {item.icon ? (
                        <Icon name={item.icon} className={`size-5 ${a.text}`} />
                      ) : (
                        <svg viewBox="0 0 16 16" className={`size-3.5 ${a.text}`} fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" d="M4 8.5l3 3 5-6" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[0.95rem] font-semibold text-foreground leading-snug">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/60">
                        {item.description}
                      </p>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* ── Right: Z-Axis Feature Card Stack ── */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <div className="relative h-[320px] w-[300px]">

              {/* Ambient glow behind cards */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[220px] rounded-full opacity-20 dark:opacity-10"
                style={{ background: `radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)` }}
              />

              {/* Card 1 — back left */}
              {section.items[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute left-0 top-2 w-[220px] -rotate-[4deg] scale-95 opacity-55"
                  style={{ transformOrigin: "center center" }}
                >
                  <FeatureCard item={section.items[0]} a={a} />
                </motion.div>
              )}

              {/* Card 2 — back right */}
              {section.items[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute bottom-2 right-0 w-[220px] rotate-[3deg] scale-[0.97] opacity-65"
                  style={{ transformOrigin: "center center" }}
                >
                  <FeatureCard item={section.items[1]} a={a} />
                </motion.div>
              )}

              {/* Card 3 — front center */}
              {section.items[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute left-1/2 top-1/2 z-10 w-[248px] -translate-x-1/2 -translate-y-1/2"
                >
                  <FeatureCard item={section.items[2]} a={a} prominent />
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Feature card sub-component ──
function FeatureCard({
  item,
  a,
  prominent = false,
}: {
  item: { title?: string; description?: string; icon?: string };
  a: ReturnType<typeof getAccent>;
  prominent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border ${prominent ? "border-border/20 bg-card shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.35)]" : "border-border/15 bg-card/80"} p-4`}>
      <div className="flex items-start gap-3">
        {/* Double-bezel icon */}
        <div className="shrink-0 rounded-xl border border-border/15 bg-foreground/[0.02] p-1">
          <div className={`flex size-8 items-center justify-center rounded-lg ${a.iconBg}`}>
            {item.icon ? (
              <Icon name={item.icon} className={`size-4 ${a.text}`} />
            ) : (
              <svg viewBox="0 0 16 16" className={`size-3 ${a.text}`} fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 8.5l3 3 5-6" />
              </svg>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground leading-snug line-clamp-1">
            {item.title}
          </p>
          {item.description && (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/55 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
