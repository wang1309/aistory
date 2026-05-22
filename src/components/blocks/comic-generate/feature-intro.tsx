"use client";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";

interface Props {
  section: SectionType;
}

export default function ComicFeatureIntro({ section }: Props) {
  if (section.disabled) return null;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      {/* Subtle warm background */}
      <div className="absolute inset-0 bg-[oklch(0.98_0.01_65)] dark:bg-[oklch(0.15_0.01_65)]" />

      {/* Comic panel grid decoration (right side, desktop only) */}
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block">
        <div className="grid grid-cols-2 grid-rows-2 gap-3 p-8 opacity-[0.07] [width:360px] [height:360px]">
          <div className="rounded-lg border-2 border-current" />
          <div className="rounded-lg border-2 border-current" />
          <div className="col-span-2 rounded-lg border-2 border-current" />
        </div>
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl lg:max-w-none lg:grid lg:grid-cols-[1fr_300px] lg:gap-16 xl:grid-cols-[1fr_360px]">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            {section.label && (
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
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
            {section.items && section.items.length > 0 && (
              <div className="mt-10 space-y-6">
                {section.items.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      {item.icon && <Icon name={item.icon} className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {item.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right: Spacer for grid balance (decoration is absolute positioned) */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
