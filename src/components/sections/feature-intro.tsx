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
      className="max-w-xl space-y-4 text-[1.05rem] leading-[1.85] text-muted-foreground/70 [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-1.5 [&>p:first-of-type]:first-letter:font-display [&>p:first-of-type]:first-letter:text-[3.25rem] [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:leading-[0.85] [&>p:first-of-type]:first-letter:text-primary"
    >
      {section.description.split("\n\n").map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  ) : null;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Ambient background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full opacity-[0.08] dark:opacity-[0.05]"
          style={{ background: "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)" }} />
        <div className="absolute -right-[5%] top-[10%] h-[320px] w-[320px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.88 0.04 80) 0%, transparent 70%)" }} />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
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
            <figure className="group rounded-[1.5rem] border border-border/15 bg-foreground/[0.012] p-1.5 transition-colors duration-500 hover:border-border/28 dark:bg-white/[0.015]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[calc(1.5rem-0.375rem)] bg-card">
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
            <li key={i} className="group border-t border-border/25 pt-6">
              <div className="flex items-center justify-between gap-4">
                <span
                  aria-hidden="true"
                  className={`text-sm font-bold tabular-nums tracking-[0.12em] ${a.text} opacity-70`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.icon && (
                  <div className="shrink-0 rounded-xl border border-border/15 bg-foreground/[0.02] p-1 transition-colors duration-500 group-hover:border-primary/20">
                    <div className={`flex size-8 items-center justify-center rounded-lg ${a.iconBg}`}>
                      <Icon name={item.icon} className={`size-4 ${a.text}`} />
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-4 text-[0.95rem] font-semibold leading-snug text-foreground">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground/60">
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
