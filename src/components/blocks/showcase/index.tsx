"use client";

import { Link } from "@/i18n/navigation";
import { Section as SectionType } from "@/types/blocks/section";
import SectionHeader from "@/components/sections/section-header";
import OptimizedImage from "@/components/seo/optimized-image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function Showcase({ section }: { section: SectionType }) {
  const tCommon = useTranslations("common");

  if (section.disabled) return null;

  return (
    <section
      id={section.name || "story_showcase"}
      className="relative py-28 lg:py-36 overflow-hidden"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.96_0.03_65),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.15_0.02_55),transparent)]" />
        <div
          className="absolute -left-[8%] bottom-[5%] h-[350px] w-[350px] rounded-full opacity-[0.07] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container relative z-10">
        {/* Header — static SSR, consistent with every other section */}
        <div className="mb-16">
          <SectionHeader
            label={section.label}
            title={section.title}
            description={section.description}
            align="center"
            highlight="AI"
            accent="amber"
            descriptionClassName="font-light"
          />
        </div>

        {/* Magazine story index — uniform 3×2, no orphan cells */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items?.map((item, index) => (
            <ShowcaseCard key={index} item={item} index={index} ctaLabel={tCommon("read_story")} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({
  item,
  index,
  ctaLabel,
}: {
  item: any;
  index: number;
  ctaLabel: string;
}) {
  return (
    <Link href={item.url || ""} target={item.target} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: (index % 3) * 0.07, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="group h-full"
      >
        {/* Outer shell — shared double-bezel language */}
        <div className="h-full rounded-[1.5rem] border border-border/15 bg-foreground/[0.012] p-1.5 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/30 dark:bg-white/[0.015]">
          {/* Inner core */}
          <div className="flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            {/* Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <OptimizedImage
                src={item.image?.src || ""}
                alt={item.image?.alt || item.title || "Example"}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
              />

              {/* Subtle hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-card/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100" />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
              {item.label && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                  {item.label}
                </span>
              )}
              <h3 className="mt-1.5 font-display text-[1.05rem] font-bold tracking-tight text-foreground leading-snug line-clamp-2">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground/55 leading-relaxed">
                {item.description}
              </p>

              {/* Bottom CTA row */}
              <div className="mt-4 flex items-center justify-between border-t border-border/10 pt-4">
                <span className="text-xs font-semibold text-muted-foreground/50 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-foreground/70">
                  {ctaLabel}
                </span>
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-foreground/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:bg-foreground/[0.09]">
                  <svg viewBox="0 0 16 16" className="h-3 w-3 text-muted-foreground/40 transition-colors duration-300 group-hover:text-foreground/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M5 3l6 5-6 5" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
