"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import AutoScroll from "embla-carousel-auto-scroll";
import { Section as SectionType } from "@/types/blocks/section";
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

  if (section.disabled) return null;

  return (
    <section
      ref={containerRef}
      id={section.name}
      className="relative py-28 lg:py-36 overflow-hidden"
    >
      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          style={{ opacity }}
          className="mx-auto flex max-w-xl flex-col items-center gap-4 mb-16 text-center"
        >
          {section.label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
              {section.label}
            </span>
          )}
          {section.title && (
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl leading-[1.1]">
              {section.title}
            </h2>
          )}
          {section.description && (
            <p className="max-w-md text-base text-muted-foreground/70 leading-relaxed font-light">
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
    <div className="w-[300px] sm:w-[380px]">
      {/* Outer bezel */}
      <div className="rounded-[1.25rem] border border-border/15 bg-foreground/[0.015] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/30 dark:bg-white/[0.02]">
        {/* Inner core */}
        <div className="rounded-[calc(1.25rem-0.375rem)] bg-card p-6 h-full flex flex-col">
          {/* Decorative serif quotation mark */}
          <span className="font-display text-5xl leading-none text-foreground/[0.06] select-none">&ldquo;</span>

          {/* Review text */}
          <blockquote className="flex-1 text-muted-foreground/70 leading-relaxed font-light text-sm italic mt-2 mb-6">
            &quot;{item.content}&quot;
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/15">
            <Avatar className="size-9 rounded-full">
              <AvatarImage
                src={item.image?.src}
                alt={item.image?.alt || item.title}
                className="object-cover"
              />
              <div className="flex items-center justify-center w-full h-full bg-foreground/[0.04] font-semibold text-foreground/30 text-xs">
                {item.title?.[0]}
              </div>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground/45 truncate">
                {item.sub}
              </p>
            </div>

            <div className="flex gap-0.5 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 16 16" className="size-3 text-amber-500/60" fill="currentColor">
                  <path d="M8 1.5l1.9 4.1 4.5.4-3.3 3 .8 4.5L8 11.3 4.1 13.5l.8-4.5-3.3-3 4.5-.4L8 1.5z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
