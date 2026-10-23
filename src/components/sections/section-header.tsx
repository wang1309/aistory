import { type AccentColor } from "./accent";
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
        <span className="text-primary">{markerMatch[1]}</span>
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
            <span key={i} className="text-primary">
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
  highlight,
  align = "left",
  heading = "h2",
  brush = true,
  className,
  descriptionClassName,
}: Props) {
  const centered = align === "center";
  const Heading = heading;

  return (
    <div
      className={cn(
        centered && "mx-auto max-w-[730px] text-center",
        !centered && "max-w-[730px]",
        className
      )}
    >
      {label && (
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.19em] text-accent-copper">
          <span className={cn("inline-block size-1.5 rounded-full bg-accent-copper", centered && "opacity-70")} />
          {label}
        </span>
      )}

      {title && (
        <Heading
          className={cn(
            "font-display text-[clamp(2.35rem,4.6vw,3.9rem)] font-normal leading-[0.98] tracking-[-0.065em] text-foreground",
            label && (centered ? "mt-5" : "mt-5")
          )}
        >
          {renderHighlightedTitle(title, highlight)}
        </Heading>
      )}

      {brush && title && (
        <div
          className={cn(
            "mt-5 mb-5 h-px w-12 bg-accent-copper/60",
            centered && "mx-auto"
          )}
          aria-hidden="true"
        />
      )}

      {description && (
        <p
          className={cn(
            "font-serif text-[17px] leading-[1.55] text-muted-foreground sm:text-[18px]",
            centered && "mx-auto max-w-[620px]",
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
