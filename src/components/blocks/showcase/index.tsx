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
      className="relative scroll-mt-24 overflow-hidden border-y border-border/60 bg-muted py-[68px] sm:py-[100px]"
    >
      <div className="container relative z-10">
        {/* Header — static SSR, consistent with every other section */}
        <div className="mb-12">
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
        {/* Outer shell — shared editorial paper frame */}
        <div className="h-full rounded-[2px] border border-border bg-card p-[6px] shadow-[5px_7px_0_rgba(36,77,61,0.07)] transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-[7px_9px_0_rgba(36,77,61,0.09)] dark:shadow-[5px_7px_0_rgba(0,0,0,0.45)]">
          {/* Inner core */}
          <div className="flex h-full flex-col overflow-hidden rounded-[1px] bg-card">
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
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent-copper">
                  {item.label}
                </span>
              )}
              <h3 className="mt-2 font-display text-[21px] font-normal tracking-[-0.02em] text-foreground leading-[1.15] line-clamp-2">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-2 flex-1 text-[13px] text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              {/* Bottom CTA row */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors duration-300 group-hover:text-accent-copper">
                  {ctaLabel}
                </span>
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-sage text-accent-copper transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
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
