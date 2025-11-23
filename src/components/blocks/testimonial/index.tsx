"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import AutoScroll from "embla-carousel-auto-scroll";
import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { Star } from "lucide-react";
import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";

export default function Testimonial({ section }: { section: SectionType }) {
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

  const plugin = useRef(
    AutoScroll({
      startDelay: 500,
      speed: 0.7,
    })
  );

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
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-30 pointer-events-none animate-blob" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[128px] opacity-20 pointer-events-none animate-blob animation-delay-2000" />

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

        {/* Carousel Section */}
        <div className="relative lg:-mx-20">
          {/* Enhanced Fade Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 lg:w-64 bg-gradient-to-r from-background via-background/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 lg:w-64 bg-gradient-to-l from-background via-background/80 to-transparent z-20 pointer-events-none" />

          <Carousel
            opts={{
              loop: true,
              align: "center",
            }}
            plugins={[plugin.current]}
            onMouseLeave={() => plugin.current.play()}
            className="w-full"
          >
            <CarouselContent className="-ml-4 lg:-ml-8 py-8">
              {section.items?.map((item, index) => (
                <CarouselItem key={index} className="pl-4 lg:pl-8 basis-auto">
                  <TestimonialCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ item }: { item: any }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className="group relative w-[320px] sm:w-[400px] rounded-2xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors duration-500 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Gradient */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500 z-10"
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

      <div className="relative p-8 z-20 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4 items-center">
            <div className="relative">
               <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <Avatar className="size-12 rounded-full ring-2 ring-border group-hover:ring-primary/30 transition-all duration-500">
                <AvatarImage
                  src={item.image?.src}
                  alt={item.image?.alt || item.title}
                  className="object-cover"
                />
                <div className="flex items-center justify-center w-full h-full bg-muted/20 font-semibold text-primary/50">
                   {item.title?.[0]}
                </div>
              </Avatar>
            </div>
            
            <div>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground/80 font-medium uppercase tracking-wide">
                {item.sub}
              </p>
            </div>
          </div>

          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-4 fill-amber-500/80 text-amber-500/80"
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1">
          <Icon name="quote" className="absolute -top-2 -left-2 size-8 text-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <blockquote className="relative text-muted-foreground/90 leading-relaxed font-light text-base italic">
            "{item.content}"
          </blockquote>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-primary/10 rounded-tr-2xl opacity-50 group-hover:opacity-100 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-primary/10 rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-all duration-500" />
      </div>
    </div>
  );
}
