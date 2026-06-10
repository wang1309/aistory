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

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-xl"
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

        {/* First item — prominent double-bezel card */}
        {section.items[0] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="mt-14"
          >
            {/* Outer bezel */}
            <div className="rounded-[1.5rem] border border-border/20 bg-foreground/[0.015] p-1.5 dark:bg-white/[0.02]">
              {/* Inner core */}
              <div className="rounded-[1.125rem] bg-card px-6 py-7 sm:px-8 sm:py-8">
                <div className="flex items-start gap-5">
                  {section.items[0].icon && (
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.iconBg}`}>
                      <Icon name={section.items[0].icon} className={`h-5 w-5 ${a.text}`} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{section.items[0].title}</h3>
                    {section.items[0].description && (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground/65">
                        {section.items[0].description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Remaining items — grid with double-bezel cards */}
        {section.items.length > 1 && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.slice(1).map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i + 1) * 0.07, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Outer bezel */}
                <div className={`group rounded-[1.25rem] border border-border/20 bg-foreground/[0.015] p-1 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/40 dark:bg-white/[0.02]`}>
                  {/* Inner core */}
                  <div className="rounded-[calc(1.25rem-0.375rem)] bg-card px-5 py-5 sm:px-6 sm:py-6">
                    {item.icon && (
                      <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${a.iconBg} transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110`}>
                        <Icon name={item.icon} className={`h-4.5 w-4.5 ${a.text}`} />
                      </div>
                    )}
                    <h3 className="text-[0.95rem] font-semibold text-foreground">{item.title}</h3>
                    {item.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground/60">{item.description}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
