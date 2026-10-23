export type AccentColor =
  | "orange"
  | "teal"
  | "emerald"
  | "rose"
  | "amber";

export interface Accent {
  text: string;
  iconBg: string;
  border: string;
  solid: string;
  shadow: string;
  hoverBorder: string;
  hoverBg: string;
  btnPrimary: string;
  btnSecondary: string;
  badge: string;
  numActive: string;
  line: string;
  tint: string;
  sectionBg: string;
  /**
   * Cover-block gradient for media cards (tool directory covers).
   */
  cover: string;
  /**
   * Low-opacity tint for the oversized decorative glyph on covers.
   */
  coverGlyph: string;
}

/**
 * Neutral design language (type.ai-inspired): every accent name resolves to
 * the same restrained ink/primary set so sections stay visually coherent.
 * The AccentColor union is kept for API compatibility with existing call
 * sites — they render identically regardless of the name passed.
 */
const neutral: Accent = {
  text: "text-accent-copper",
  iconBg: "bg-accent-sage",
  border: "border-accent-copper/25",
  solid: "bg-primary",
  shadow: "shadow-[4px_4px_0_rgba(36,77,61,0.14)]",
  hoverBorder: "hover:border-primary/40",
  hoverBg: "hover:bg-accent-sage/60",
  btnPrimary:
    "bg-primary text-primary-foreground shadow-[4px_4px_0_rgba(36,77,61,0.14)] hover:bg-primary/90 hover:-translate-x-px hover:-translate-y-px",
  btnSecondary:
    "border border-border bg-transparent hover:border-primary/40 hover:bg-card",
  badge: "bg-accent-sage text-accent-copper",
  numActive: "bg-accent-sage text-accent-copper",
  line: "via-accent-copper/30",
  tint: "bg-accent-sage/40",
  sectionBg: "bg-muted",
  cover:
    "bg-gradient-to-br from-accent-sage via-card to-accent-rose/40",
  coverGlyph: "text-primary/10",
};

const accents: Record<AccentColor, Accent> = {
  orange: neutral,
  teal: neutral,
  emerald: neutral,
  rose: neutral,
  amber: neutral,
};

export function getAccent(color: AccentColor = "orange"): Accent {
  return accents[color];
}
