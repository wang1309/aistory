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
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Layered background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,oklch(0.17_0_0),transparent)]" />
        <div
          className="absolute -right-[6%] top-[15%] h-[320px] w-[320px] rounded-full opacity-[0.07] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.95 0 0) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -left-[5%] bottom-[10%] h-[280px] w-[280px] rounded-full opacity-[0.06] dark:opacity-[0.035]"
          style={{ background: "radial-gradient(circle, oklch(0.95 0 0) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">

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

        {/* Steps pipeline */}
        <div className="relative mt-20">
          {/* Horizontal connecting line (desktop only) */}
          <div className="absolute top-[3.5rem] left-[16.67%] right-[16.67%] hidden h-px bg-gradient-to-r from-border/10 via-border/20 to-border/10 sm:block" />

          <div className="grid gap-8 md:grid-cols-3 lg:gap-6">
            {section.items.slice(0, 3).map((item, i) => (
              <div key={i} className="group relative flex flex-col items-center text-center">
                {/* Step node — icon inside double-bezel circle */}
                <div className="relative z-10 mb-8">
                  {/* Ambient glow behind node */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-20 rounded-full opacity-20 dark:opacity-10 transition-opacity duration-500 group-hover:opacity-30"
                    style={{ background: `radial-gradient(circle, oklch(0.95 0 0) 0%, transparent 70%)` }}
                  />

                  {/* Outer shell */}
                  <div className="relative rounded-full border border-border/15 bg-foreground/[0.012] p-1.5 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.04)] dark:bg-white/[0.015] dark:shadow-[0_2px_20px_-8px_rgba(0,0,0,0.2)]">
                    {/* Inner core */}
                    <div className={`flex size-14 items-center justify-center rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${a.iconBg}`}>
                      <div className={a.text}>
                        {item.icon ? (
                          <Icon name={item.icon} className="size-5" />
                        ) : (
                          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" d="M4 8.5l3 3 5-6" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step number badge — small pill below node */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                    <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${i === 0 ? "border-primary/20 bg-primary/[0.06] text-primary" : "border-border/15 bg-card text-muted-foreground/50"}`}>
                      Step {i + 1}
                    </span>
                  </div>
                </div>

                {/* Step card — double bezel */}
                <div className="w-full">
                  {/* Outer shell */}
                  <div className="rounded-[1.5rem] border border-border/15 bg-foreground/[0.012] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-border/28 dark:bg-white/[0.015]">
                    {/* Inner core */}
                    <div className="rounded-[calc(1.5rem-0.375rem)] bg-card px-6 py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      {/* Large decorative index */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none select-none absolute top-4 right-5 text-[5rem] font-black leading-none text-foreground/[0.025] dark:text-foreground/[0.035]"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
