"use client";

import { FanficWhat as FanficWhatType } from "@/types/blocks/fanfic-what";
import Icon from "@/components/icon";

export default function FanficWhat({ section }: { section: FanficWhatType | undefined }) {
  // Early return if section is not provided or disabled
  if (!section || section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="relative py-20 sm:py-24 overflow-hidden bg-background">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient blur circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/3 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="container relative">
        {/* Content Section */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Label Badge */}
          {section.label && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
              <Icon name="sparkles" className="w-4 h-4" />
              {section.label}
            </div>
          )}

          {/* Title */}
          {section.title && (
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                {section.title}
              </span>
            </h2>
          )}

          {/* Subtitle */}
          {section.subtitle && (
            <p className="mb-6 text-lg md:text-xl text-muted-foreground font-medium">
              {section.subtitle}
            </p>
          )}

          {/* Introduction Paragraph */}
          {section.intro_paragraph && (
            <p className="text-base md:text-lg text-muted-foreground/90 leading-relaxed max-w-3xl mx-auto">
              {section.intro_paragraph}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
