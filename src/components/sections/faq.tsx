"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { getAccent, type AccentColor } from "./accent";
import SectionHeader from "./section-header";
import { useState } from "react";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function FAQ({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.17_0_0),transparent)]" />
        <div
          className="absolute -left-[6%] bottom-[8%] h-[350px] w-[350px] rounded-full opacity-[0.07] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.95 0 0) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr]">

          {/* Left column — sticky heading */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeader
              label={section.label}
              title={section.title}
              description={section.description}
              accent={accent}
              highlight="AI Story Generator"
              descriptionClassName="max-w-md text-base font-light"
            />
          </div>

          {/* Right column — accordion */}
          <div className="space-y-4">
            {section.items.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className={`group relative rounded-[1.25rem] border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isOpen
                      ? "border-border/40 bg-card shadow-[0_2px_20px_-6px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.3)]"
                      : "border-border/15 bg-card/60 hover:border-border/25"
                  }`}
                >
                  {/* Left accent bar — only when open */}
                  <div
                    className={`absolute left-0 top-3 bottom-3 w-px transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isOpen ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ background: "linear-gradient(to bottom, transparent, oklch(0.72 0.16 55 / 0.4), transparent)" }}
                  />

                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full min-h-[44px] items-center gap-3 px-4 py-4 text-left sm:gap-4 sm:px-6 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                  >
                    {/* Double-bezel number badge */}
                    <div className={`shrink-0 rounded-lg border p-0.5 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "border-primary/20" : "border-border/15 bg-foreground/[0.02]"}`}>
                      <span className={`flex size-6 items-center justify-center rounded-md text-[10px] font-semibold tabular-nums transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? a.iconBg + " " + a.text : "bg-foreground/[0.04] text-muted-foreground/50"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <span className="flex-1 text-[0.95rem] font-semibold text-foreground">{item.title}</span>

                    {/* Chevron in circular container */}
                    <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "bg-foreground/[0.06]" : "bg-foreground/[0.03]"}`}>
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className={`size-4 text-muted-foreground/40 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "rotate-180" : ""}`}
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path strokeLinecap="round" d="M4 6l4 4 4-4" />
                      </svg>
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
                      <div className="px-4 pb-5 sm:px-6 sm:pl-[4.25rem]">
                        <p className="text-sm leading-[1.7] text-muted-foreground/60">{item.description}</p>
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
