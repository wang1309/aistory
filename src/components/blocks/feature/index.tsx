import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function Feature({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="relative py-20 sm:py-24 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl opacity-25 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />

      <div className="container relative">
        {/* Header Section */}
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 mb-16 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-8 motion-safe:duration-700">
          {/* Optional Section Label Badge */}
          {section.label && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-foreground text-sm font-semibold mb-4">
              <Icon name="sparkles" className="size-4" />
              {section.label}
            </div>
          )}

          {/* Title with Gradient */}
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight lg:text-3xl xl:text-4xl leading-[1.2]">
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
              {section.title}
            </span>
          </h2>

          {/* Description */}
          <p className="max-w-2xl text-base lg:text-lg text-muted-foreground/90 leading-[1.65]">
            {section.description}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {section.items?.map((item, i) => (
            <div
              key={i}
              className="group relative motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-8 motion-safe:duration-700"
              style={{
                animationDelay: `${i * 100 + 200}ms`,
              }}
            >
              {/* Card glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/20 to-accent/0 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />

              {/* Feature Card */}
              <div className="relative h-full flex flex-col p-8 rounded-xl bg-gradient-to-br from-background/80 to-background/40 border border-border/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] hover:border-primary/30 group-hover:bg-background/95">
                {/* Icon Container */}
                {item.icon && (
                  <div className="relative mb-6 flex items-center justify-center">
                    {/* Icon glow */}
                    <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Icon background */}
                    <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/30 shadow-lg group-hover:border-primary/50 group-hover:scale-110 transition-all duration-500 group-hover:shadow-primary/20">
                      <Icon
                        name={item.icon}
                        className="size-10 text-primary transition-all duration-500 group-hover:scale-110"
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 flex flex-col text-center items-center">
                  <h3 className="mb-3 text-lg font-bold text-foreground/90 transition-colors duration-300 group-hover:text-primary leading-[1.3]">
                    {item.title}
                  </h3>
                  <p className="text-sm lg:text-base text-muted-foreground/80 leading-[1.65]">
                    {item.description}
                  </p>
                </div>

                {/* Decorative bottom accent */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
