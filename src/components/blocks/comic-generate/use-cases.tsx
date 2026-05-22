"use client";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";

interface Props {
  section: SectionType;
}

export default function ComicUseCases({ section }: Props) {
  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div className="absolute inset-0 bg-[oklch(0.98_0.01_65)] dark:bg-[oklch(0.15_0.01_65)]" />

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
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
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-orange-500/20 hover:bg-orange-500/[0.02]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 transition-colors group-hover:bg-orange-500/15 dark:text-orange-400">
                {item.icon && <Icon name={item.icon} className="h-4.5 w-4.5" />}
              </div>
              <h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>
              {item.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
