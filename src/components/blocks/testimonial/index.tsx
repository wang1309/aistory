"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import AutoScroll from "embla-carousel-auto-scroll";
import { Section as SectionType } from "@/types/blocks/section";
import SectionHeader from "@/components/sections/section-header";
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
          className="mx-auto max-w-xl mb-16 text-center"
        >
          <SectionHeader
            label={section.label}
            title={section.title}
            description={section.description}
            align="center"
            highlight="AI Story Generator"
            accent="amber"
            descriptionClassName="font-light"
          />
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
      {/* Outer shell */}
      <div className="rounded-[1.5rem] border border-border/15 bg-foreground/[0.012] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/28 dark:bg-white/[0.015]">
        {/* Inner core */}
        <div className="rounded-[calc(1.5rem-0.375rem)] bg-card p-6 h-full flex flex-col shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          {/* Decorative serif quotation mark */}
          <span className="font-display text-6xl leading-none text-primary/15 select-none">&ldquo;</span>

          {/* Review text */}
          <blockquote className="flex-1 text-muted-foreground/70 leading-[1.7] text-[0.9rem] mt-2 mb-6">
            &quot;{item.content}&quot;
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/15">
            {/* Avatar with ring */}
            <div className="shrink-0 rounded-full border border-border/15 bg-foreground/[0.02] p-0.5">
              <Avatar className="size-9 rounded-full ring-2 ring-card">
                <AvatarImage
                  src={item.image?.src}
                  alt={item.image?.alt || item.title}
                  className="object-cover rounded-full"
                />
                <div className="flex items-center justify-center w-full h-full rounded-full bg-primary/[0.08] font-bold text-primary/50 text-xs">
                  {item.title?.[0]}
                </div>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground/50 truncate">
                {item.sub}
              </p>
            </div>

            {/* Star rating — primary color */}
            <div className="flex gap-0.5 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 16 16" className="size-3 text-primary/50" fill="currentColor">
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
