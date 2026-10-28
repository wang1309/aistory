import { GenreSeoLink } from "@/components/blocks/genre-story-seo-shared";
import GenreStoryTitleGenerator from "@/components/blocks/genre-story-title-generator";
import type { MysteryStorySeo } from "@/types/blocks/genre-story-generate";

const ALLOWED_HREFS = ["/", "/horror-story-generator"] as const;

export default function MysteryStorySeoContent({
  section,
}: {
  section: MysteryStorySeo;
}) {
  return (
    <div className="relative overflow-hidden">
      <section className="border-t border-border/60 py-[68px] sm:py-[92px]">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.04em]">
            {section.ideas_and_plots.title}
          </h2>
          <p className="mt-4 max-w-3xl font-serif text-[17px] leading-[1.8] text-muted-foreground">
            {section.ideas_and_plots.intro}
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {section.ideas_and_plots.items.map((item) => (
              <article
                key={item.title}
                className="border border-border bg-card p-5 shadow-[5px_6px_0_rgba(36,77,61,0.05)] dark:shadow-[5px_6px_0_rgba(0,0,0,0.4)]"
              >
                <h3 className="font-display text-[20px] leading-snug tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <h3 className="font-display text-[clamp(1.5rem,3vw,2.1rem)] font-normal tracking-[-0.03em]">
              {section.ideas_and_plots.twist_title}
            </h3>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              {section.ideas_and_plots.twist_intro}
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted py-[68px] sm:py-[92px]">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.04em]">
            {section.prompts_by_subgenre.title}
          </h2>
          <p className="mt-4 max-w-2xl font-serif text-[16px] leading-[1.8] text-muted-foreground">
            {section.prompts_by_subgenre.intro}
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {section.prompts_by_subgenre.items.map((item) => (
              <article key={item.title} className="border border-border bg-card p-5">
                <h3 className="font-display text-[19px] tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[68px] sm:py-[92px]">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.04em]">
                {section.murder_mystery.title}
              </h2>
              <p className="mt-4 font-serif text-[16px] leading-[1.8] text-muted-foreground">
                {section.murder_mystery.intro}
              </p>
              <div className="mt-5 space-y-3">
                {section.murder_mystery.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 24)}
                    className="text-[13.5px] leading-[1.85] text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            <aside className="border border-border bg-card p-5">
              <h3 className="font-display text-[19px] tracking-[-0.02em]">
                {section.title_generator.title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                {section.title_generator.description}
              </p>
              <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
                {section.story_ideas.href
                  ? section.ideas_and_plots.twist_intro
                  : section.ideas_and_plots.intro}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section
        id="mystery-titles"
        className="border-y border-border/60 bg-muted py-[68px] sm:py-[92px]"
      >
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.04em]">
            {section.title_generator.title}
          </h2>
          <p className="mt-4 max-w-2xl font-serif text-[16px] leading-[1.8] text-muted-foreground">
            {section.title_generator.description}
          </p>
          <div className="mt-8">
            <GenreStoryTitleGenerator
              genre="mystery"
              section={section.title_generator}
            />
          </div>
        </div>
      </section>

      <section className="py-[68px] sm:py-[92px]">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.04em]">
            {section.how_to.title}
          </h2>
          <p className="mt-4 max-w-2xl font-serif text-[16px] leading-[1.8] text-muted-foreground">
            {section.how_to.intro}
          </p>
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {section.how_to.steps.map((step, index) => (
              <li key={step.title} className="border-t-2 border-primary/30 pt-4">
                <span className="font-display text-[12px] tracking-[0.12em] text-accent-copper">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-[19px] leading-snug tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted py-[68px] sm:py-[92px]">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.04em]">
            {section.clues.title}
          </h2>
          <p className="mt-4 max-w-2xl font-serif text-[16px] leading-[1.8] text-muted-foreground">
            {section.clues.intro}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {section.clues.items.map((item) => (
              <article key={item.title} className="border border-border bg-card p-5">
                <h3 className="font-display text-[18px] tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[68px] sm:py-[92px]">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.04em]">
            {section.comparison.title}
          </h2>
          <p className="mt-4 max-w-2xl font-serif text-[16px] leading-[1.8] text-muted-foreground">
            {section.comparison.intro}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border-l-2 border-primary/40 pl-4">
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {section.comparison.mystery}
              </p>
            </div>
            <div className="border-l-2 border-foreground/20 pl-4">
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {section.comparison.thriller}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted py-[68px] sm:py-[92px]">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.04em]">
            {section.audiences.title}
          </h2>
          <p className="mt-4 max-w-2xl font-serif text-[16px] leading-[1.8] text-muted-foreground">
            {section.audiences.intro}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {section.audiences.items.map((item) => (
              <article key={item.title} className="border border-border bg-card p-4">
                <h3 className="font-display text-[18px] tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[68px] sm:py-[92px]">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.05] tracking-[-0.04em]">
            {section.definition.title}
          </h2>
          <p className="mt-4 max-w-2xl font-serif text-[16px] leading-[1.8] text-muted-foreground">
            {section.definition.intro}
          </p>
          <div className="mt-6 max-w-3xl space-y-4">
            {section.definition.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="text-[14px] leading-[1.85] text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5">
            {section.internal_links.map((link) => (
              <GenreSeoLink
                key={`${link.label}-${link.href ?? "none"}`}
                link={link}
                allowed={ALLOWED_HREFS}
                className="text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
