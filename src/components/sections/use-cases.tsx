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

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className={`absolute inset-0 ${a.sectionBg}`} />

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="mx-auto max-w-xl text-center"
        >
          {section.label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground backdrop-blur-sm">
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

        {/* Bento grid */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {section.items.map((item, i) => {
            const isFeatured = i === 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.32, 0.72, 0, 1] }}
                className={`group ${isFeatured ? "sm:col-span-2 lg:row-span-2" : ""}`}
              >
                {/* Outer bezel */}
                <div className={`h-full rounded-[1.25rem] border border-border/15 bg-foreground/[0.015] p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/35 dark:bg-white/[0.02] ${isFeatured ? "rounded-[1.5rem] p-1.5" : ""}`}>
                  {/* Inner core */}
                  <div className={`flex h-full flex-col bg-card ${isFeatured ? "rounded-[calc(1.5rem-0.375rem)] px-6 py-7 sm:px-8 sm:py-9" : "rounded-[calc(1.25rem-0.25rem)] px-5 py-5"}`}>
                    {item.icon && (
                      <div className={`mb-4 flex ${isFeatured ? "h-11 w-11" : "h-9 w-9"} items-center justify-center rounded-lg ${a.iconBg} transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110`}>
                        <Icon name={item.icon} className={`${isFeatured ? "h-5 w-5" : "h-4 w-4"} ${a.text}`} />
                      </div>
                    )}
                    <h3 className={`font-semibold text-foreground ${isFeatured ? "text-lg" : "text-[0.95rem]"}`}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className={`mt-2 leading-relaxed text-muted-foreground/60 ${isFeatured ? "text-sm" : "text-sm"}`}>
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
