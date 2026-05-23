"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function CTA({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled) return null;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      {/* Tinted background */}
      <div className={`absolute inset-0 ${a.tint}`} />

      {/* Decorative grid */}
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
                        ? `${a.btnPrimary}`
                        : `border border-border bg-card text-foreground ${a.btnSecondary}`
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
