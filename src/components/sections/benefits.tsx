import { Section as SectionType } from "@/types/blocks/section";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";
import SectionHeader from "./section-header";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function Benefits({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden py-[68px] sm:py-[100px]">
      <div className="relative mx-auto max-w-[1210px] px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <SectionHeader
          label={section.label}
          title={section.title}
          description={section.description}
          accent={accent}
          highlight="Story Generator"
        />

        {/* Numbered editorial cards */}
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {section.items.map((item, i) => (
            <li
              key={i}
              className="group flex h-full flex-col border border-border bg-card p-[22px] shadow-[5px_6px_0_rgba(36,77,61,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[7px_9px_0_rgba(36,77,61,0.08)] dark:shadow-[5px_6px_0_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  aria-hidden="true"
                  className={`font-display text-[13px] tracking-[0.12em] ${a.text}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.icon && (
                  <div className={`flex size-9 items-center justify-center rounded-full ${a.iconBg}`}>
                    <Icon name={item.icon} className={`size-4 ${a.text}`} />
                  </div>
                )}
              </div>

              <h3 className="mt-5 font-display text-[21px] font-normal leading-[1.2] tracking-[-0.02em] text-foreground">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
}
