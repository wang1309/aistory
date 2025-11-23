"use client";

import { Link } from "@/i18n/navigation";
import { Section as SectionType } from "@/types/blocks/section";
import OptimizedImage from "@/components/seo/optimized-image";
import Icon from "@/components/icon";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRef } from "react";

export default function Showcase({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);

  return (
    <section 
      ref={containerRef}
      id="story_showcase" 
      className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden"
    >
      {/* Background Layer */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.05] pointer-events-none" />
      
      {/* Premium Noise Texture */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none" />
      
      {/* Ethereal Aurora Gradients */}
      <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-30 pointer-events-none animate-blob" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[128px] opacity-20 pointer-events-none animate-blob animation-delay-2000" />

      <div className="container relative z-10">
        {/* Header Section */}
        <motion.div 
          style={{ y, opacity }}
          className="mx-auto flex max-w-3xl flex-col items-center gap-2 mb-20 text-center"
        >
          {/* Sophisticated Label */}
          {section.label && (
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-gradient-to-r from-primary/0 to-primary/50" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">{section.label}</span>
              <div className="h-px w-16 bg-gradient-to-l from-primary/0 to-primary/50" />
            </div>
          )}

          {/* Editorial Heading */}
          {section.title && (
            <h2 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              {section.title}
            </h2>
          )}

          {/* Refined Description */}
          {section.description && (
            <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground/80 leading-relaxed font-light">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {section.items?.map((item, index) => (
            <ShowcaseCard key={index} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({ item, index }: { item: any, index: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <Link href={item.url || ""} target={item.target} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        onMouseMove={handleMouseMove}
        className="group relative h-full rounded-2xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors duration-500 overflow-hidden flex flex-col"
      >
        {/* Spotlight Gradient */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500 z-30"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                600px circle at ${mouseX}px ${mouseY}px,
                color-mix(in srgb, var(--primary), transparent 94%),
                transparent 40%
              )
            `,
          }}
        />

        {/* Image Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border/50">
          <OptimizedImage
            src={item.image?.src || ""}
            alt={item.image?.alt || item.title || "Showcase example"}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Cinematic Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
        </div>

        {/* Content Container */}
        <div className="relative flex flex-col flex-1 p-6 lg:p-8 z-20">
          <div className="flex-1">
             {/* Title with hover arrow effect */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h3 className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300 line-clamp-1">
                {item.title}
              </h3>
              <div className="shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary">
                <Icon name="arrow-right" className="w-5 h-5" />
              </div>
            </div>
            
            <p className="text-muted-foreground/80 leading-relaxed font-light line-clamp-3 mb-4">
              {item.description}
            </p>
          </div>

          {/* Decorative corner accent */}
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-primary/10 rounded-br-2xl opacity-50 group-hover:opacity-100 transition-all duration-500" />
        </div>
      </motion.div>
    </Link>
  );
}
