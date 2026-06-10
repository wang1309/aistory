"use client";

import { Link } from "@/i18n/navigation";
import { Section as SectionType } from "@/types/blocks/section";
import OptimizedImage from "@/components/seo/optimized-image";
import { ArrowUpRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Showcase({ section }: { section: SectionType }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  if (section.disabled) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      id={section.name || "story_showcase"}
      className="relative py-20 lg:py-28 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: 'var(--bg-grid)', backgroundSize: '40px 40px' }} />

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          style={{ opacity }}
          className="mx-auto flex max-w-2xl flex-col items-center gap-3 mb-14 text-center"
        >
          {section.label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1 text-xs font-medium text-foreground">
              {section.label}
            </span>
          )}

          {section.title && (
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
              {section.title}
            </h2>
          )}

          {section.description && (
            <p className="max-w-xl text-base sm:text-lg text-muted-foreground/80 leading-relaxed font-light">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {section.items?.map((item, index) => (
            <ShowcaseCard key={index} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({ item, index }: { item: any, index: number }) {
  return (
    <Link href={item.url || ""} target={item.target} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08, duration: 0.4 }}
        className="card-hover-lift group h-full rounded-2xl border border-border bg-card hover:border-orange-300 dark:hover:border-orange-400/40 transition-colors duration-200 overflow-hidden flex flex-col"
      >
        {/* Image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <OptimizedImage
            src={item.image?.src || ""}
            alt={item.image?.alt || item.title || "Example"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-base font-semibold text-foreground tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
              {item.title}
            </h3>
            <ArrowUpRight className="size-4 shrink-0 mt-0.5 text-muted-foreground/40 group-hover:text-orange-500 transition-colors" />
          </div>

          <p className="text-sm text-muted-foreground/70 leading-relaxed font-light line-clamp-2">
            {item.description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
