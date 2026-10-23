import { Section as SectionType } from "@/types/blocks/section";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Props {
  section: SectionType;
  accent?: string;
  locale?: string;
}

export default function CTA({ section, locale }: Props) {
  if (section.disabled) return null;

  return (
    <section className="relative overflow-hidden py-[68px] sm:py-[82px]">
      <div className="relative mx-auto max-w-[1210px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 rounded-[2px] bg-primary px-8 py-10 text-primary-foreground shadow-[10px_10px_0_rgba(36,77,61,0.10)] md:flex-row md:items-center md:px-12 md:py-12 dark:shadow-[10px_10px_0_rgba(0,0,0,0.45)]">
          <div>
            {section.title && (
              <h2 className="font-display text-[clamp(1.9rem,4vw,2.8rem)] font-normal leading-[1.05] tracking-[-0.045em] text-primary-foreground">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="mt-3 max-w-xl font-serif text-[17px] leading-relaxed text-primary-foreground/75">
                {section.description}
              </p>
            )}
          </div>
          {section.buttons && section.buttons.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {section.buttons.map((btn, i) => {
                const isPrimary = i === 0;
                return (
                  <Link
                    key={i}
                    href={btn.url || "#"}
                    locale={locale === "en" ? undefined : locale}
                    target={btn.target || undefined}
                    className={cn(
                      "group inline-flex items-center gap-2.5 rounded-[3px] px-6 py-3 text-[13px] font-semibold transition-all duration-300 active:scale-[0.98]",
                      isPrimary
                        ? "bg-card text-primary hover:-translate-y-px hover:shadow-[4px_4px_0_rgba(0,0,0,0.12)]"
                        : "border border-primary-foreground/35 text-primary-foreground hover:border-primary-foreground/70 hover:bg-primary-foreground/5"
                    )}
                  >
                    {btn.icon && (
                      <Icon name={btn.icon} className="h-4 w-4 opacity-70" />
                    )}
                    {btn.title}
                    {isPrimary && (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px]">
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" d="M6 3l5 5-5 5" />
                        </svg>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
