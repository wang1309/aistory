import { Section } from "@/types/blocks/section";

interface Props {
  section: Section;
}

/**
 * Literature review outline example — server-rendered paper card showing the
 * skeleton every generated draft follows. Section items carry:
 *   title       → the structural heading (e.g. "## Introduction")
 *   description → what the part is for
 *   content     → a sample line with a visible [source needed] marker
 */
export default function LiteratureReviewExample({ section }: Props) {
  if (!section || section.disabled) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container max-w-4xl mx-auto px-4">
        {section.label && (
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            {section.label}
          </p>
        )}
        {section.title && (
          <h2 className="text-center font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {section.title}
          </h2>
        )}
        {section.description && (
          <p className="mt-4 text-center text-base leading-relaxed text-muted-foreground/80 max-w-2xl mx-auto">
            {section.description}
          </p>
        )}

        <div className="mt-10 rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-6 sm:px-8 py-3">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="ml-3 text-xs font-medium text-muted-foreground/70">
              {section.name || "literature-review-draft.md"}
            </span>
          </div>

          <ol className="divide-y divide-border/40">
            {(section.items || []).map((item, i) => (
              <li key={i} className="px-6 sm:px-8 py-6 sm:py-7 flex gap-4 sm:gap-6">
                <span className="hidden sm:block font-display text-sm font-semibold text-primary/70 tabular-nums pt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <code className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                      {item.title}
                    </code>
                    <span className="text-sm text-muted-foreground/75">{item.description}</span>
                  </div>
                  {item.content && (
                    <blockquote className="mt-3 border-l-2 border-border pl-4 text-sm italic leading-relaxed text-muted-foreground/70 font-display">
                      {item.content}
                    </blockquote>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
