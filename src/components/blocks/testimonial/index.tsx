import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Section as SectionType } from "@/types/blocks/section";
import SectionHeader from "@/components/sections/section-header";

export default function Testimonial({ section }: { section: SectionType }) {
  if (section.disabled) return null;

  return (
    <section
      id={section.name}
      className="relative overflow-hidden py-[68px] sm:py-[100px]"
    >
      <div className="container relative z-10">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-xl text-center">
          <SectionHeader
            label={section.label}
            title={section.title}
            description={section.description}
            align="center"
            highlight="AI Story Generator"
            accent="amber"
            descriptionClassName="font-light"
          />
        </div>

        {/* Static editorial quote grid — six entries fill 3×2 on desktop */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items?.map((item, index) => (
            <TestimonialCard key={index} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ item }: { item: any }) {
  return (
    <article className="flex h-full flex-col border border-border bg-card p-6 shadow-[5px_6px_0_rgba(36,77,61,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[7px_9px_0_rgba(36,77,61,0.08)] dark:shadow-[5px_6px_0_rgba(0,0,0,0.45)]">
      <span
        aria-hidden="true"
        className="font-display text-5xl leading-[0.7] text-accent-copper/40 select-none"
      >
        &ldquo;
      </span>

      <blockquote className="mt-4 flex-1 font-serif text-[16.5px] leading-[1.6] text-foreground/85">
        &quot;{item.content}&quot;
      </blockquote>

      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <div className="shrink-0 rounded-full border border-border bg-card p-0.5">
          <Avatar className="size-9 rounded-full">
            <AvatarImage
              src={item.image?.src}
              alt={item.image?.alt || item.title}
              className="rounded-full object-cover"
            />
            <div className="flex h-full w-full items-center justify-center rounded-full bg-accent-sage text-[11px] font-bold text-accent-copper">
              {item.title?.[0]}
            </div>
          </Avatar>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-foreground">
            {item.title}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{item.sub}</p>
        </div>

        <div className="flex shrink-0 gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 16 16"
              className="size-3 text-accent-copper/70"
              fill="currentColor"
            >
              <path d="M8 1.5l1.9 4.1 4.5.4-3.3 3 .8 4.5L8 11.3 4.1 13.5l.8-4.5-3.3-3 4.5-.4L8 1.5z" />
            </svg>
          ))}
        </div>
      </div>
    </article>
  );
}
