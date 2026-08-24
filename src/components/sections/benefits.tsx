import { Section as SectionType } from "@/types/blocks/section";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function Benefits({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  const HIGHLIGHT = "Story Generator";
  const titleParts = section.title?.split(HIGHLIGHT);
  const hasHighlight = titleParts && titleParts.length === 2;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.95_0.04_65),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,oklch(0.16_0.02_55),transparent)]" />
        <div
          className="absolute -right-[10%] top-[20%] h-[350px] w-[350px] rounded-full opacity-[0.07] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.88 0.04 80) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-2xl">
          {section.label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              <span className={`inline-block size-1.5 rounded-full ${a.solid}`} />
              {section.label}
            </span>
          )}

          {section.title && (
            <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {hasHighlight ? (
                <>
                  {titleParts[0]}
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    {HIGHLIGHT}
                  </span>
                  {titleParts[1]}
                </>
              ) : (
                section.title
              )}
            </h2>
          )}

          {/* Decorative brush stroke */}
          <svg
            className="mt-2 mb-5 h-2.5 w-28 text-primary/25"
            viewBox="0 0 160 12"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M2 8c30-5 60-6 90-3s40 4 66-1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {section.description && (
            <p className="text-[1.05rem] leading-relaxed text-muted-foreground/65">
              {section.description}
            </p>
          )}
        </div>

        {/* Ledger checklist — equal-weight steps, sequence carried by the index */}
        <ol className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:gap-x-16">
          {section.items.map((item, i) => (
            <li key={i} className="border-t border-border/25 pt-7">
              <div className="flex items-center justify-between gap-4">
                <span
                  aria-hidden="true"
                  className={`text-sm font-bold tabular-nums tracking-[0.12em] ${a.text} opacity-70`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.icon && (
                  <div className="shrink-0 rounded-xl border border-border/15 bg-foreground/[0.02] p-1">
                    <div className={`flex size-8 items-center justify-center rounded-lg ${a.iconBg}`}>
                      <Icon name={item.icon} className={`size-4 ${a.text}`} />
                    </div>
                  </div>
                )}
              </div>

              <h3 className="mt-3 text-[0.95rem] font-bold tracking-tight text-foreground leading-snug">
                {item.title}
              </h3>
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
