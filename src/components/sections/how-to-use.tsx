import { Section as SectionType } from "@/types/blocks/section";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";
import SectionHeader from "./section-header";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function HowToUse({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-muted py-[68px] sm:py-[100px]">
      <div className="relative mx-auto max-w-[1210px] px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <SectionHeader
          label={section.label}
          title={section.title}
          description={section.description}
          accent={accent}
          align="center"
          highlight="AI Story Generators"
          descriptionClassName="font-light"
        />

        {/* Editorial steps — copper index, serif title, hairline arrow */}
        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {section.items.slice(0, 3).map((item, i) => (
            <div key={i} className="relative md:pr-8">
              {i < 2 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 top-2 hidden text-[22px] leading-none text-muted-foreground/40 md:block"
                >
                  →
                </span>
              )}
              <div className="flex items-center gap-3">
                <span className={`flex size-9 items-center justify-center rounded-full ${a.iconBg}`}>
                  <span className={a.text}>
                    {item.icon ? (
                      <Icon name={item.icon} className="size-4" />
                    ) : (
                      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" d="M4 8.5l3 3 5-6" />
                      </svg>
                    )}
                  </span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-copper">
                  Step {i + 1}
                </span>
              </div>

              <h3 className="mt-5 font-display text-[21px] font-normal leading-[1.2] tracking-[-0.02em] text-foreground">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
