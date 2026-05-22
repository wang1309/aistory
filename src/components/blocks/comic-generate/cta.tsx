"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import Icon from "@/components/icon";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  section: SectionType;
}

export default function ComicCTA({ section }: Props) {
  if (section.disabled) return null;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      {/* Warm orange tinted background */}
      <div className="absolute inset-0 bg-orange-600/[0.04] dark:bg-orange-500/[0.06]" />

      {/* Comic panel grid decoration */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-4 grid-rows-3 gap-3 [width:600px] [height:400px]">
          <div className="col-span-2 rounded-lg border-2 border-current" />
          <div className="row-span-2 rounded-lg border-2 border-current" />
          <div className="rounded-lg border-2 border-current" />
          <div className="col-span-2 rounded-lg border-2 border-current" />
          <div className="rounded-lg border-2 border-current" />
          <div className="col-span-2 rounded-lg border-2 border-current" />
          <div className="rounded-lg border-2 border-current" />
          <div className="col-span-2 rounded-lg border-2 border-current" />
        </div>
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          {section.title && (
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {section.title}
            </h2>
          )}
          {section.description && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {section.description}
            </p>
          )}
          {section.buttons && section.buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {section.buttons.map((btn, i) => {
                const isPrimary = i === 0;
                return (
                  <Link
                    key={i}
                    href={btn.url || "#"}
                    target={btn.target || undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors",
                      isPrimary
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600"
                        : "border border-border bg-card text-foreground hover:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    )}
                  >
                    {btn.icon && <Icon name={btn.icon} className="h-4 w-4" />}
                    {btn.title}
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
