"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import AutoScroll from "embla-carousel-auto-scroll";
import { Section as SectionType } from "@/types/blocks/section";
import { Star, Quote } from "lucide-react";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Testimonial({ section }: { section: SectionType }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  const plugin = useRef(
    AutoScroll({
      startDelay: 500,
      speed: 0.7,
    })
  );

  if (section.disabled) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      id={section.name}
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
              <Star className="w-3.5 h-3.5 text-orange-500" />
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

        {/* Carousel */}
        <div className="relative lg:-mx-16">
          <div className="absolute left-0 top-0 bottom-0 w-24 lg:w-48 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 lg:w-48 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

          <Carousel
            opts={{
              loop: true,
              align: "center",
            }}
            plugins={[plugin.current]}
            onMouseLeave={() => plugin.current.play()}
            className="w-full"
          >
            <CarouselContent className="-ml-4 lg:-ml-6 py-4">
              {section.items?.map((item, index) => (
                <CarouselItem key={index} className="pl-4 lg:pl-6 basis-auto">
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
  return (
    <div className="group w-[300px] sm:w-[380px] rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors duration-300">
      <div className="p-6 h-full flex flex-col">
        {/* Quote icon */}
        <Quote className="size-8 text-orange-500/15 mb-4" />

        {/* Review text */}
        <blockquote className="flex-1 text-muted-foreground/90 leading-relaxed font-light text-sm italic mb-6">
          &quot;{item.content}&quot;
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Avatar className="size-10 rounded-full ring-1 ring-border">
            <AvatarImage
              src={item.image?.src}
              alt={item.image?.alt || item.title}
              className="object-cover"
            />
            <div className="flex items-center justify-center w-full h-full bg-orange-500/10 font-semibold text-orange-600/60 text-sm">
              {item.title?.[0]}
            </div>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {item.title}
            </p>
            <p className="text-xs text-muted-foreground/60 truncate">
              {item.sub}
            </p>
          </div>

          <div className="flex gap-0.5 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-3 fill-amber-500/80 text-amber-500/80"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
