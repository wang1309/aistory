"use client";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRef } from "react";

export default function Feature({ section }: { section: SectionType }) {
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
      id={section.name} 
      className="relative py-32 lg:py-48 overflow-hidden"
    >
      {/* Background Layer */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.05] pointer-events-none" />
      
      {/* Premium Noise Texture */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none" />
      
      {/* Ethereal Aurora Gradients */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-30 pointer-events-none animate-blob" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[128px] opacity-20 pointer-events-none animate-blob animation-delay-2000" />

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
          <h2 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {section.title}
          </h2>

          {/* Refined Description */}
          <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground/80 leading-relaxed font-light">
            {section.description}
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {section.items?.map((item, i) => (
            <FeatureCard key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ item, index }: { item: any, index: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseMove={handleMouseMove}
      className="group relative h-full rounded-2xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors duration-500 overflow-hidden"
    >
      {/* Spotlight Gradient */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500"
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

      <div className="relative h-full p-8 flex flex-col items-center text-center z-10">
        {/* Icon Container */}
        {item.icon && (
          <div className="relative mb-8 group-hover:scale-110 transition-transform duration-500">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icon Box */}
            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 group-hover:border-primary/30 transition-colors duration-500 shadow-lg shadow-primary/5">
              <Icon
                name={item.icon}
                className="w-10 h-10 text-primary/80 group-hover:text-primary transition-colors duration-500"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <h3 className="mb-4 text-xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
          {item.title}
        </h3>
        
        <p className="text-muted-foreground/80 leading-relaxed font-light">
          {item.description}
        </p>

        {/* Decorative Corner Accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-primary/10 rounded-tl-2xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 origin-top-left" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-primary/10 rounded-br-2xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 origin-bottom-right" />
      </div>
    </motion.div>
  );
}
