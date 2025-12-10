"use client";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import Image from "next/image";
import { useState, useRef } from "react";
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";

export default function Feature1({ section }: { section: SectionType }) {
  const [imageError, setImageError] = useState(false);
  const t = useTranslations('introduce');
  const containerRef = useRef<HTMLDivElement>(null);
  const hasImage = Boolean(section.image?.src);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);

  if (section.disabled) {
    return null;
  }

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
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[128px] opacity-40 pointer-events-none animate-blob" />
      <div className="absolute top-1/2 right-0 translate-x-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[128px] opacity-30 pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid items-center gap-20 lg:grid-cols-2 lg:gap-24">
          
          {/* Left: Visual Showcase */}
          {(
            <motion.div 
              style={{ y, opacity }}
              className="relative group perspective-1000"
            >
              {/* Ambient Glow Behind */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
              
              {/* Main Glass Container */}
              <div className="relative rounded-[2rem] bg-background/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/5 overflow-hidden transition-all duration-700 group-hover:shadow-primary/10">
                {/* Specular Highlight Border */}
                <div className="absolute inset-0 rounded-[2rem] border border-white/20 pointer-events-none z-20" />
                <div className="absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/5 pointer-events-none z-20" />
                
                {imageError || !hasImage ? (
                  <div className="aspect-[4/3] w-full flex items-center justify-center bg-muted/5">
                    <div className="text-center p-12">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/10 flex items-center justify-center">
                        <Icon name="image" className="size-8 text-primary/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground/50 tracking-wide">{t('image_not_available')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] overflow-hidden group-hover:scale-[1.02] transition-transform duration-1000 ease-out">
                    <Image
                      src={section.image?.src || ""}
                      alt={section.title || t('default_alt_text')}
                      fill
                      className="object-cover"
                      priority={true}
                      quality={100}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                      onError={() => setImageError(true)}
                    />
                    {/* Cinematic Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-background/20 via-transparent to-white/5 pointer-events-none" />
                  </div>
                )}

                {/* Dynamic Sheen Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none z-10" />
              </div>
            </motion.div>
          )}

          {/* Right: Narrative Content */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Sophisticated Label */}
              {section.label && (
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px w-8 bg-gradient-to-r from-primary/0 to-primary/50" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">{section.label}</span>
                  <div className="h-px w-16 bg-gradient-to-l from-primary/0 to-primary/50" />
                </div>
              )}

              {/* Editorial Heading */}
              {section.title && (
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8 text-foreground">
                  {section.title}
                </h2>
              )}

              {/* Refined Description */}
              {section.description && (
                <p className="text-lg sm:text-xl text-muted-foreground/80 leading-relaxed mb-12 max-w-xl font-light">
                  {section.description}
                </p>
              )}
            </motion.div>

            {/* Feature List - Modern Minimalist */}
            <div className="flex flex-col gap-3">
              {section.items?.map((item, i) => (
                <FeatureItem key={i} item={item} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ item, index }: { item: any, index: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
      onMouseMove={handleMouseMove}
      className="group relative rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors duration-500 overflow-hidden"
    >
      {/* Spotlight Gradient */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              color-mix(in srgb, var(--primary), transparent 90%),
              transparent 40%
            )
          `,
        }}
      />

      <div className="relative flex items-start gap-5 p-6">
        {/* Minimalist Icon Box */}
        {item.icon && (
          <div className="relative shrink-0 mt-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 text-primary border border-primary/10 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
              <Icon name={item.icon} className="w-5 h-5" />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Subtle Indicator */}
        <div className="self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-primary">
           <Icon name="arrow-right" className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}
