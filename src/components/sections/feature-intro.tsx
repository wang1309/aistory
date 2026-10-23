import Image from "next/image";
import { Section as SectionType } from "@/types/blocks/section";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";
import SectionHeader from "./section-header";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function FeatureIntro({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  const imageSrc = section.image?.src;

  // Editorial lead paragraph with a serif drop cap on the first letter.
  const lead = section.description ? (
    <div
      className="max-w-xl space-y-4 font-serif text-[17px] leading-[1.8] text-muted-foreground [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-1.5 [&>p:first-of-type]:first-letter:font-display [&>p:first-of-type]:first-letter:text-[3.25rem] [&>p:first-of-type]:first-letter:font-normal [&>p:first-of-type]:first-letter:leading-[0.85] [&>p:first-of-type]:first-letter:text-accent-copper"
    >
      {section.description.split("\n\n").map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  ) : null;

  return (
    <section className="relative overflow-hidden py-[68px] sm:py-[100px]">
      <div className="relative mx-auto max-w-[1210px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label={section.label}
          title={section.title}
          accent={accent}
          highlight="AI Story Generator"
        />

        {/* ── Lead + illustration ── */}
        {imageSrc ? (
          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {lead}
            <figure className="group rounded-[2px] border border-border bg-card p-[6px] shadow-[8px_9px_0_rgba(36,77,61,0.08)] transition-colors duration-500 hover:border-primary/30 dark:shadow-[8px_9px_0_rgba(0,0,0,0.45)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1px] bg-muted">
                <Image
                  src={imageSrc}
                  alt={section.image?.alt || section.title || ""}
                  fill
                  sizes="(min-width: 1024px) 45vw, (min-width: 640px) 90vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                />
              </div>
            </figure>
          </div>
        ) : (
          <div className="mt-12">{lead}</div>
        )}

        {/* ── Numbered ledger ── */}
        <ol className="mt-16 grid gap-x-10 gap-y-10 sm:grid-cols-3">
          {section.items.map((item, i) => (
            <li key={i} className="group border-t border-border pt-6">
              <div className="flex items-center justify-between gap-4">
                <span
                  aria-hidden="true"
                  className={`font-display text-[13px] font-normal tracking-[0.12em] ${a.text}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.icon && (
                  <div className={`flex size-9 items-center justify-center rounded-full ${a.iconBg}`}>
                    <Icon name={item.icon} className={`size-4 ${a.text}`} />
                  </div>
                )}
              </div>
              <p className="mt-4 font-display text-[19px] font-normal leading-snug text-foreground">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
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
