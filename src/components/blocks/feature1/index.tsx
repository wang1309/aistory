import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import OptimizedImage from "@/components/seo/optimized-image";

export default function Feature1({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="relative py-20 sm:py-24 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="container relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image Section with Enhanced Styling */}
          {section.image && (
            <div className="relative group motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-8 motion-safe:duration-700">
              {/* Glow effect behind image */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

              {/* Image container */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-border/50 shadow-2xl ring-1 ring-white/10 group-hover:border-primary/50 transition-all duration-500 group-hover:shadow-primary/20 group-hover:scale-[1.02]">
                <OptimizedImage
                  src={section.image?.src || ""}
                  alt={section.title || "AI Story Generator feature illustration"}
                  fill
                  className="object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          )}

          {/* Content Section */}
          <div className="flex flex-col lg:text-left motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-8 motion-safe:duration-700">
            {/* Section Label Badge */}
            {section.label && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6 w-fit">
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

            {/* Items as Enhanced Cards */}
            <div className="flex flex-col gap-5">
              {section.items?.map((item, i) => (
                <div
                  key={i}
                  className="group/item relative"
                  style={{
                    animationDelay: `${i * 100}ms`,
                  }}
                >
                  {/* Card glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/20 to-accent/0 rounded-2xl opacity-0 group-hover/item:opacity-100 blur transition-opacity duration-500" />

                  {/* Card */}
                  <div className="relative flex gap-4 p-5 rounded-xl bg-gradient-to-br from-background/80 to-background/40 border border-border/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 group-hover/item:bg-background/95">
                    {/* Icon Container */}
                    {item.icon && (
                      <div className="relative flex-shrink-0">
                        {/* Icon glow */}
                        <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />

                        {/* Icon background */}
                        <div className="relative flex items-center justify-center size-12 rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/30 group-hover/item:border-primary/50 group-hover/item:scale-110 transition-all duration-300">
                          <Icon
                            name={item.icon}
                            className="size-6 text-primary group-hover/item:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    )}

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground/90 mb-2 group-hover/item:text-primary transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Decorative arrow */}
                    <div className="flex-shrink-0 self-center opacity-0 group-hover/item:opacity-100 transition-all duration-300 -translate-x-2 group-hover/item:translate-x-0">
                      <Icon
                        name="arrow-right"
                        className="size-5 text-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
