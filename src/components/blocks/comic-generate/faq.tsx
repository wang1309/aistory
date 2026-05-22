"use client";

import { useState } from "react";
import { Section as SectionType } from "@/types/blocks/section";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  section: SectionType;
}

export default function ComicFAQ({ section }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
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

          <div className="mt-12 divide-y divide-border">
            {section.items.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                        isOpen
                          ? "bg-orange-500/15 text-orange-600 dark:bg-orange-400/15 dark:text-orange-400"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {i + 1}
                      </span>
                      <span className="font-medium text-foreground">{item.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pl-9 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
