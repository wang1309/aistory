"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

import Fade from "embla-carousel-fade";
import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

const DURATION = 5000;

export default function Feature2({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const [api, setApi] = useState<CarouselApi>();
  const [currentAccordion, setCurrentAccordion] = useState("1");

  useEffect(() => {
    api?.scrollTo(+currentAccordion - 1);
    const interval = setInterval(() => {
      setCurrentAccordion((prev) => {
        const next = parseInt(prev) + 1;
        return next > (section.items?.length || 3) ? "1" : next.toString();
      });
    }, DURATION);

    return () => clearInterval(interval);
  }, [api, currentAccordion, section.items?.length]);

  return (
    <section id={section.name} className="relative py-20 sm:py-24 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />

      <div className="container relative">
        <div className="mx-auto grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Content & Accordion */}
          <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-8 motion-safe:duration-700">
            {/* Section Label Badge */}
            {section.label && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-foreground text-sm font-semibold mb-6">
                <Icon name="sparkles" className="size-4" />
                {section.label}
              </div>
            )}

            {/* Title with Gradient */}
            {section.title && (
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight lg:text-4xl xl:text-5xl">
                <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                  {section.title}
                </span>
              </h2>
            )}

            {/* Description */}
            {section.description && (
              <p className="mb-10 text-base lg:text-lg text-muted-foreground/90 leading-relaxed max-w-2xl">
                {section.description}
              </p>
            )}

            {/* Enhanced Accordion */}
            <Accordion
              type="single"
              value={currentAccordion}
              onValueChange={(value) => {
                setCurrentAccordion(value);
                api?.scrollTo(+value - 1);
              }}
              className="space-y-4"
            >
              {section.items?.map((item, i) => {
                const isActive = currentAccordion === (i + 1).toString();
                return (
                  <AccordionItem
                    key={i}
                    value={(i + 1).toString()}
                    className="border-0"
                  >
                    <div className="relative group">
                      {/* Card glow effect - stronger when active */}
                      <div className={`absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur transition-opacity duration-500 ${
                        isActive ? 'opacity-75' : 'opacity-0 group-hover:opacity-50'
                      }`} />

                      {/* Card */}
                      <div className={`relative rounded-xl transition-all duration-500 ${
                        isActive
                          ? 'bg-gradient-to-br from-primary/10 via-background/95 to-accent/10 border-2 border-primary/40 shadow-xl shadow-primary/10'
                          : 'bg-gradient-to-br from-background/60 to-background/30 border border-border/50 hover:border-primary/30 hover:bg-background/80'
                      } backdrop-blur-sm`}>
                        <AccordionTrigger className={`px-5 py-4 hover:no-underline transition-colors duration-300 ${
                          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}>
                          <div className="flex items-center gap-4 w-full">
                            {/* Icon Container */}
                            {item.icon && (
                              <div className="relative flex-shrink-0">
                                {/* Icon glow - stronger when active */}
                                <div className={`absolute inset-0 rounded-lg blur-md transition-opacity duration-300 ${
                                  isActive ? 'bg-primary/40 opacity-100' : 'bg-primary/20 opacity-0 group-hover:opacity-100'
                                }`} />

                                {/* Icon background */}
                                <div className={`relative flex items-center justify-center size-12 rounded-lg border transition-all duration-300 ${
                                  isActive
                                    ? 'bg-gradient-to-br from-primary/30 via-primary/20 to-accent/30 border-primary/50 scale-110'
                                    : 'bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/20 group-hover:border-primary/40 group-hover:scale-105'
                                }`}>
                                  <Icon
                                    name={item.icon}
                                    className={`size-6 transition-all duration-300 ${
                                      isActive
                                        ? 'text-primary scale-110'
                                        : 'text-primary/70 group-hover:text-primary group-hover:scale-110'
                                    }`}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Title */}
                            <span className={`flex-1 text-left font-bold text-base lg:text-lg transition-colors duration-300 ${
                              isActive ? 'text-primary' : ''
                            }`}>
                              {item.title}
                            </span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-5 pb-5">
                          <div className="pl-16 pr-4">
                            <p className="text-sm lg:text-base text-muted-foreground/90 leading-relaxed mb-6">
                              {item.description}
                            </p>

                            {/* Enhanced Progress Bar */}
                            <div className="relative h-1 bg-gradient-to-r from-muted via-muted to-muted rounded-full overflow-hidden">
                              <div
                                className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary animate-progress rounded-full shadow-lg shadow-primary/50"
                                style={{
                                  animationDuration: `${DURATION}ms`,
                                }}
                              >
                                {/* Glow effect on progress */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm" />
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </div>
                    </div>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* Right Column - Enhanced Carousel */}
          <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-8 motion-safe:duration-700 motion-safe:delay-200">
            <div className="relative group">
              {/* Carousel glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

              {/* Carousel container */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-border/50 shadow-2xl ring-1 ring-white/10 group-hover:border-primary/50 transition-all duration-500 group-hover:shadow-primary/20">
                <Carousel
                  opts={{
                    duration: 50,
                  }}
                  setApi={setApi}
                  plugins={[Fade()]}
                  className="w-full"
                >
                  <CarouselContent>
                    {section.items?.map((item, i) => (
                      <CarouselItem key={i}>
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={item.image?.src}
                            alt={item.image?.alt || item.title}
                            className="w-full h-full object-cover transition-transform duration-700"
                          />
                          {/* Overlay gradient for depth */}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent pointer-events-none" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>

              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl -translate-x-2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-primary/30 rounded-br-2xl translate-x-2 translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
