"use client";

import { FanficFeature1 as FanficFeature1Type } from "@/types/blocks/fanfic-feature1";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedBadge as Badge } from "@/components/ui/enhanced-badge";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";

export default function FanficFeature1({ section }: { section: FanficFeature1Type | undefined }) {
  // Early return if section is not provided
  if (!section) {
    return null;
  }

  // Data comes from page props, not from translation hooks
  const features = section.features || [];
  const statistics = section.statistics || [];

  return (
    <section id={section.name} className="relative py-20 sm:py-24 overflow-hidden bg-background">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient blur circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />

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
        {/* Header Section */}
        <div className="text-center mb-16">
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
            <p className="mb-6 text-lg md:text-xl text-muted-foreground">
              {section.subtitle}
            </p>
          )}

          {/* Description */}
          {section.description && (
            <p className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto">
              {section.description}
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={cn(
                "group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm",
                "hover:border-primary/50 transition-all duration-300",
                "hover:shadow-lg hover:shadow-primary/10",
                "hover:-translate-y-1"
              )}
            >
              {/* Glow effect on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-pink-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

              <CardContent className="relative p-6">
                {/* Icon */}
                {feature.icon && (
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon name={feature.icon} className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-bold text-foreground/90 mb-2 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground/80 leading-relaxed">
                  {feature.description}
                </p>

                {/* Highlight badge */}
                {feature.highlight && (
                  <Badge variant="success" size="sm" className="mt-3">
                    {section.recommended_badge || '推荐'}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 rounded-3xl blur-xl" />

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm">
            {statistics.map((stat, index) => (
              <div
                key={index}
                className="text-center group cursor-default"
              >
                {/* Icon */}
                {stat.icon && (
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon name={stat.icon} className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                )}

                {/* Value */}
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Image (if provided) */}
        {section.image && (
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
            <img
              src={section.image.src}
              alt={section.image.alt}
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </div>
    </section>
  );
}
