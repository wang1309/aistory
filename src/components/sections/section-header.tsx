import { getAccent, type AccentColor } from "./accent";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  title?: string;
  description?: string;
  accent?: AccentColor;
  /**
   * Legacy phrase to highlight inside the title (split on it, like the
   * previous per-section HIGHLIGHT constants). Prefer `**markers**` in the
   * copy instead — they work in every locale.
   */
  highlight?: string;
  align?: "left" | "center";
  heading?: "h1" | "h2" | "h3";
  brush?: boolean;
  className?: string;
  descriptionClassName?: string;
}

const MARKER = /\*\*(.+?)\*\*/;

function renderHighlightedTitle(title: string, highlight?: string) {
  const markerMatch = title.match(MARKER);
  if (markerMatch) {
    // split with a capturing group yields [before, captured, after]
    const [before, , after] = title.split(MARKER);
    return (
      <>
        {before}
        <span className="text-gradient-brand">{markerMatch[1]}</span>
        {after}
      </>
    );
  }

  if (highlight && title.includes(highlight)) {
    const parts = title.split(highlight);
    return parts.flatMap((part, i) =>
      i < parts.length - 1
        ? [
            part,
            <span key={i} className="text-gradient-brand">
              {highlight}
            </span>,
          ]
        : [part]
    );
  }

  return title;
}

export default function SectionHeader({
  label,
  title,
  description,
  accent = "orange",
  highlight,
  align = "left",
  heading = "h2",
  brush = true,
  className,
  descriptionClassName,
}: Props) {
  const a = getAccent(accent);
  const centered = align === "center";
  const Heading = heading;

  return (
    <div
      className={cn(
        centered && "mx-auto max-w-xl text-center",
        !centered && "max-w-2xl",
        className
      )}
    >
      {label && (
        <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
          <span className={cn("inline-block size-1.5 rounded-full", a.solid, centered && "opacity-60")} />
          {label}
        </span>
      )}

      {title && (
        <Heading
          className={cn(
            "font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]",
            label && (centered ? "mt-5" : "mt-6")
          )}
        >
          {renderHighlightedTitle(title, highlight)}
        </Heading>
      )}

      {brush && title && (
        <div
          className={cn(
            "mt-3 mb-5 h-px w-12 rounded-full bg-foreground/20",
            centered && "mx-auto"
          )}
          aria-hidden="true"
        />
      )}

      {description && (
        <p
          className={cn(
            "text-[1.05rem] leading-relaxed text-muted-foreground/65",
            centered && "mx-auto max-w-lg",
            brush && title ? "" : label || title ? "mt-5" : "",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
