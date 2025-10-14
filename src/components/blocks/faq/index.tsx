"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function FAQ({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="relative py-20 sm:py-24 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl opacity-25 pointer-events-none" />

      <div className="container relative">
        {/* Header Section */}
        <div className="text-center mb-16 max-w-3xl mx-auto motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-8 motion-safe:duration-700">
          {/* Section Label Badge */}
          {section.label && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
              <Icon name="help-circle" className="size-4" />
              {section.label}
            </div>
          )}

          {/* Title with Gradient */}
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight lg:text-4xl xl:text-5xl">
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
              {section.title}
            </span>
          </h2>

          {/* Description */}
          <p className="text-base lg:text-lg text-muted-foreground/90 leading-relaxed">
            {section.description}
          </p>
        </div>

        {/* FAQ Accordion - Single Column */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="multiple" className="space-y-4">
            {section.items?.map((item, index) => (
              <div
                key={index}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-8 motion-safe:duration-700"
                style={{
                  animationDelay: `${index * 100 + 200}ms`,
                }}
              >
                <AccordionItem value={`item-${index}`} className="border-0">
                  <div className="group relative">
                    {/* Card glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-50 group-data-[state=open]:opacity-75 transition-opacity duration-500" />

                    {/* Accordion Card */}
                    <div className="relative rounded-xl bg-gradient-to-br from-background/80 to-background/40 border border-border/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-500 hover:border-primary/30 group-data-[state=open]:border-primary/40 group-data-[state=open]:shadow-xl group-data-[state=open]:shadow-primary/10 group-data-[state=open]:bg-background/95">
                      {/* Accordion Trigger (Question) */}
                      <AccordionTrigger className="w-full px-6 py-5 hover:no-underline group/trigger">
                        <div className="flex items-start gap-4 flex-1 text-left">
                          {/* Number Badge */}
                          <div className="relative flex-shrink-0">
                            {/* Badge glow */}
                            <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md opacity-0 group-hover/trigger:opacity-100 group-data-[state=open]:opacity-100 transition-opacity duration-300" />

                            {/* Badge container */}
                            <div className="relative flex items-center justify-center size-10 rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/30 font-bold text-sm text-primary transition-all duration-300 group-hover/trigger:border-primary/50 group-hover/trigger:scale-105 group-data-[state=open]:border-primary/50 group-data-[state=open]:scale-105 group-data-[state=open]:bg-gradient-to-br group-data-[state=open]:from-primary/30 group-data-[state=open]:via-primary/20 group-data-[state=open]:to-accent/30">
                              {index + 1}
                            </div>
                          </div>

                          {/* Question Text */}
                          <h3 className="flex-1 text-base lg:text-lg font-bold text-foreground/90 transition-colors duration-300 group-hover/trigger:text-primary group-data-[state=open]:text-primary pr-4">
                            {item.title}
                          </h3>

                          {/* Chevron Icon */}
                          <div className="flex-shrink-0 flex items-center justify-center size-6 text-primary transition-transform duration-300 group-data-[state=open]:rotate-180">
                            <Icon name="chevron-down" className="size-5" />
                          </div>
                        </div>
                      </AccordionTrigger>

                      {/* Accordion Content (Answer) */}
                      <AccordionContent className="px-6 pb-6">
                        <div className="pl-14 pr-10">
                          <div className="pt-2 pb-4 border-t border-border/30">
                            <p className="text-sm lg:text-base text-muted-foreground/90 leading-relaxed mt-4">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </div>
                  </div>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        </div>

        {/* Optional: Help Text */}
        <div className="mt-12 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-700 motion-safe:delay-500">
          <p className="text-sm text-muted-foreground/70">
            <Icon name="info" className="inline size-4 mr-1" />
            Can't find what you're looking for? Contact our support team
          </p>
        </div>
      </div>
    </section>
  );
}
