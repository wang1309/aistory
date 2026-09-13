import { Section as SectionType } from "@/types/blocks/section";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";
import SectionHeader from "./section-header";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function UseCases({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Layered background — replaces flat a.sectionBg */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(0.17_0_0),transparent)]" />
        <div
          className="absolute -left-[8%] bottom-[5%] h-[380px] w-[380px] rounded-full opacity-[0.08] dark:opacity-[0.05]"
          style={{ background: "radial-gradient(circle, oklch(0.95 0 0) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-[5%] top-[15%] h-[280px] w-[280px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.95 0 0) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">

        {/* Centered header */}
        <SectionHeader
          label={section.label}
          title={section.title}
          description={section.description}
          accent={accent}
          align="center"
          highlight="AI Story Generators"
        />

        {/* Equal 3-column grid */}
        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {section.items.map((item, i) => {
            const isFeatured = i === 0;
            const indexLabel = String(i + 1).padStart(2, "0");

            return (
              <div key={i}>
                {/* Outer shell */}
                <div className="group h-full rounded-[1.75rem] border border-border/15 bg-foreground/[0.012] p-1.5 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/28 dark:bg-white/[0.015]">
                  {/* Inner core */}
                  <div className="relative h-full overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-card flex flex-col px-6 py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">

                    {/* Top accent gradient line — only on featured card */}
                    {isFeatured && (
                      <div
                        className="absolute inset-x-0 top-0 h-px"
                        style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 55 / 0.55), transparent)" }}
                      />
                    )}

                    {/* Large decorative index number */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute bottom-3 right-4 text-[5.5rem] font-black leading-none text-foreground/[0.03] dark:text-foreground/[0.04]"
                    >
                      {indexLabel}
                    </span>

                    {/* Double-bezel icon */}
                    {item.icon && (
                      <div className="mb-5 inline-flex rounded-xl border border-border/15 bg-foreground/[0.02] p-1 self-start">
                        <div className={`flex size-9 items-center justify-center rounded-lg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${a.iconBg}`}>
                          <Icon name={item.icon} className={`size-5 ${a.text}`} />
                        </div>
                      </div>
                    )}

                    <h3 className="text-[0.95rem] font-bold tracking-tight text-foreground leading-snug">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground/60">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
