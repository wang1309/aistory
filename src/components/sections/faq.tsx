"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { getAccent, type AccentColor } from "./accent";
import SectionHeader from "./section-header";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function FAQ({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-muted py-[68px] sm:py-[100px]">
      <div className="relative mx-auto max-w-[1210px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">

          {/* Left column — sticky heading */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeader
              label={section.label}
              title={section.title}
              description={section.description}
              accent={accent}
              highlight="AI Story Generator"
              descriptionClassName="max-w-md font-light"
            />
          </div>

          {/* Right column — flat editorial accordion */}
          <div className="border-t border-border">
            {section.items.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="border-b border-border">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full min-h-[44px] items-center gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                  >
                    <span className={cn("hidden shrink-0 font-display text-[12px] tracking-[0.12em] sm:inline", a.text)}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-display text-[17px] font-normal leading-snug tracking-[-0.01em] text-foreground sm:text-[18px]">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[22px] font-normal leading-none text-muted-foreground">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {/* Answer stays in the DOM (SEO/SERP-friendly) and collapses via
                      grid-template-rows 0fr↔1fr instead of conditional rendering. */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-5 pr-8 sm:pl-9">
                        <p className="text-[13.5px] leading-[1.75] text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
