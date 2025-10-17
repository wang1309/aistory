"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useState } from "react";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function Feature3({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const [activeTab, setActiveTab] = useState("tab-1");

  return (
    <section id={section.name} className="relative py-20 sm:py-24 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl opacity-25 pointer-events-none" />

      <div className="container relative">
        {/* Header Section */}
        <div className="mb-16 w-full flex flex-col items-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-8 motion-safe:duration-700">
          {/* Section Label Badge */}
          {section.label && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
              <Icon name="sparkles" className="size-4" />
              {section.label}
            </div>
          )}

          {/* Title with Gradient */}
          {section.title && (
            <h2 className="mb-6 text-3xl font-extrabold tracking-tight lg:text-4xl xl:text-5xl text-center w-full">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                {section.title}
              </span>
            </h2>
          )}

          {/* Description */}
          {section.description && (
            <p className="text-base lg:text-lg text-muted-foreground/90 leading-relaxed text-center w-full">
              {section.description}
            </p>
          )}
        </div>

        {/* Tabs Section */}
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-8 motion-safe:duration-700 motion-safe:delay-200">
          <Tabs defaultValue="tab-1" value={activeTab} onValueChange={setActiveTab}>
            {/* Tab List with Steps */}
            <TabsList className="relative grid gap-4 mb-12 lg:grid-cols-3 lg:gap-6 justify-items-center">
              {/* Desktop Connector Line */}
              <div className="absolute left-[calc(12.5%)] right-[calc(12.5%)] top-[38px] -z-10 hidden h-0.5 lg:block">
                <div className="h-full bg-gradient-to-r from-muted via-border to-muted rounded-full" />
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-700"
                  style={{
                    width: `${((parseInt(activeTab.split('-')[1]) - 1) / (section.items!.length - 1)) * 100}%`,
                    boxShadow: '0 0 10px rgba(var(--primary), 0.5)'
                  }}
                />
              </div>

              {section.items?.map((item, index) => {
                const isActive = activeTab === `tab-${index + 1}`;
                const tabValue = `tab-${index + 1}`;

                return (
                  <TabsTrigger
                    key={index}
                    value={tabValue}
                    className="group relative"
                  >
                    {/* Mobile Only - Vertical Layout */}
                    <div className="lg:hidden">
                      {/* Mobile Card */}
                      <div className={`relative rounded-xl transition-all duration-500 ${
                        isActive
                          ? 'bg-gradient-to-br from-primary/10 via-background/95 to-accent/10 border-2 border-primary/40 shadow-xl shadow-primary/10'
                          : 'bg-gradient-to-br from-background/60 to-background/30 border border-border/50'
                      } backdrop-blur-sm p-6`}>
                        {/* Glow effect */}
                        <div className={`absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur transition-opacity duration-500 -z-10 ${
                          isActive ? 'opacity-75' : 'opacity-0'
                        }`} />

                        <div className="flex gap-4">
                          {/* Mobile Number Badge + Connector */}
                          <div className="flex flex-col items-center">
                            {/* Number Badge */}
                            <div className={`relative flex items-center justify-center size-14 shrink-0 rounded-full font-bold text-lg transition-all duration-500 ${
                              isActive
                                ? 'bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground scale-110 shadow-lg shadow-primary/50'
                                : 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground border border-border'
                            }`}>
                              {/* Badge glow */}
                              {isActive && (
                                <div className="absolute inset-0 bg-primary/30 rounded-full blur-md" />
                              )}
                              <span className="relative z-10">{index + 1}</span>
                            </div>

                            {/* Vertical connector for mobile */}
                            {index < section.items!.length - 1 && (
                              <div className="w-0.5 h-16 mt-4 bg-gradient-to-b from-border to-muted rounded-full" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base font-bold mb-2 transition-colors duration-300 ${
                              isActive ? 'text-primary' : 'text-foreground'
                            }`}>
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground/80 leading-relaxed text-center">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Mobile Image */}
                        {item.image && isActive && (
                          <div className="mt-6 rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg">
                            <img
                              src={item.image.src}
                              alt={item.image.alt || item.title}
                              className="w-full aspect-video object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Only - Horizontal Layout */}
                    <div className="hidden lg:block">
                      <div className="relative">
                        {/* Card glow effect */}
                        <div className={`absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur transition-opacity duration-500 ${
                          isActive ? 'opacity-75' : 'opacity-0 group-hover:opacity-50'
                        }`} />

                        {/* Card */}
                        <div className={`relative rounded-xl transition-all duration-500 p-6 ${
                          isActive
                            ? 'bg-gradient-to-br from-primary/10 via-background/95 to-accent/10 border-2 border-primary/40 shadow-xl shadow-primary/10 scale-105'
                            : 'bg-gradient-to-br from-background/60 to-background/30 border border-border/50 hover:border-primary/30 hover:bg-background/80 hover:scale-102'
                        } backdrop-blur-sm`}>
                          {/* Number Badge */}
                          <div className="flex justify-center mb-6">
                            <div className={`relative flex items-center justify-center size-16 rounded-full font-bold text-xl transition-all duration-500 ${
                              isActive
                                ? 'bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground scale-110 shadow-lg shadow-primary/50 ring-4 ring-primary/20'
                                : 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground border-2 border-border group-hover:border-primary/30 group-hover:scale-105'
                            }`}>
                              {/* Badge glow */}
                              {isActive && (
                                <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg" />
                              )}
                              <span className="relative z-10">{index + 1}</span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="text-center">
                            <h3 className={`text-base font-bold mb-3 transition-colors duration-300 ${
                              isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
                            }`}>
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground/80 leading-relaxed text-center">
                              {item.description}
                            </p>
                          </div>

                          {/* Active indicator arrow */}
                          {isActive && (
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary/40" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Desktop Image Display */}
            <div className="hidden lg:block">
              <div className="relative group">
                {/* Image container glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

                {/* Image container */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-border/50 shadow-2xl ring-1 ring-white/10 group-hover:border-primary/50 transition-all duration-500 group-hover:shadow-primary/20">
                  {section.items?.map((item, index) => {
                    if (!item.image) return null;

                    return (
                      <TabsContent
                        key={index}
                        value={`tab-${index + 1}`}
                        className="aspect-video m-0 data-[state=active]:motion-safe:animate-in data-[state=active]:motion-safe:fade-in-0 data-[state=active]:motion-safe:duration-500"
                      >
                        <div className="relative w-full h-full">
                          <img
                            src={item.image.src}
                            alt={item.image.alt || item.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay gradient for depth */}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent pointer-events-none" />
                        </div>
                      </TabsContent>
                    );
                  })}
                </div>

                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl -translate-x-3 -translate-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-primary/30 rounded-br-2xl translate-x-3 translate-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
