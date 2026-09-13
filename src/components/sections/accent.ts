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
  text: "text-primary dark:text-primary",
  iconBg: "bg-primary/10",
  border: "border-primary/20",
  solid: "bg-primary",
  shadow: "shadow-primary/20 dark:shadow-primary/20",
  hoverBorder: "hover:border-primary/25",
  hoverBg: "hover:bg-primary/[0.04] dark:hover:bg-primary/[0.08]",
  btnPrimary:
    "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 dark:shadow-primary/20 dark:hover:bg-primary/90",
  btnSecondary:
    "hover:border-primary/30 hover:bg-primary/[0.04] dark:hover:bg-primary/[0.08]",
  badge: "bg-primary/10 text-primary",
  numActive: "bg-primary/10 text-primary",
  line: "via-primary/30",
  tint: "bg-primary/[0.04] dark:bg-primary/[0.06]",
  sectionBg: "bg-[oklch(0.958_0.008_85)] dark:bg-[oklch(0.165_0_0)]",
  cover:
    "bg-gradient-to-br from-foreground/[0.07] via-foreground/[0.03] to-transparent dark:from-white/[0.07] dark:via-white/[0.03]",
  coverGlyph: "text-foreground/[0.08] dark:text-white/[0.07]",
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
