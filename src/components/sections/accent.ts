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

const accents: Record<AccentColor, Accent> = {
  orange: {
    text: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-500/10",
    border: "border-orange-500/20",
    solid: "bg-orange-600 dark:bg-orange-500",
    shadow: "shadow-orange-600/20 dark:shadow-orange-500/20",
    hoverBorder: "hover:border-orange-500/20",
    hoverBg: "hover:bg-orange-500/[0.02] dark:hover:bg-orange-950/20",
    btnPrimary:
      "bg-orange-600 text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600",
    btnSecondary:
      "hover:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-950/20",
    badge: "bg-orange-500/15 text-orange-600",
    numActive: "bg-orange-500/15 text-orange-600",
    line: "via-orange-500/25",
    tint: "bg-orange-600/[0.04] dark:bg-orange-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_65)] dark:bg-[oklch(0.15_0.01_65)]",
    cover:
      "bg-gradient-to-br from-orange-500/[0.15] via-orange-500/[0.06] to-transparent dark:from-orange-400/[0.12] dark:via-orange-400/[0.05]",
    coverGlyph: "text-orange-500/[0.10] dark:text-orange-400/[0.08]",
  },
  teal: {
    text: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-500/10",
    border: "border-teal-500/20",
    solid: "bg-teal-600 dark:bg-teal-500",
    shadow: "shadow-teal-600/20 dark:shadow-teal-500/20",
    hoverBorder: "hover:border-teal-500/20",
    hoverBg: "hover:bg-teal-500/[0.02] dark:hover:bg-teal-950/20",
    btnPrimary:
      "bg-teal-600 text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 dark:bg-teal-500 dark:shadow-teal-500/20 dark:hover:bg-teal-600",
    btnSecondary:
      "hover:border-teal-500/30 hover:bg-teal-50 dark:hover:bg-teal-950/20",
    badge: "bg-teal-500/15 text-teal-600",
    numActive: "bg-teal-500/15 text-teal-600",
    line: "via-teal-500/25",
    tint: "bg-teal-600/[0.04] dark:bg-teal-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_180)] dark:bg-[oklch(0.15_0.01_180)]",
    cover:
      "bg-gradient-to-br from-teal-500/[0.15] via-teal-500/[0.06] to-transparent dark:from-teal-400/[0.12] dark:via-teal-400/[0.05]",
    coverGlyph: "text-teal-500/[0.10] dark:text-teal-400/[0.08]",
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    solid: "bg-emerald-600 dark:bg-emerald-500",
    shadow: "shadow-emerald-600/20 dark:shadow-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/20",
    hoverBg: "hover:bg-emerald-500/[0.02] dark:hover:bg-emerald-950/20",
    btnPrimary:
      "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 dark:bg-emerald-500 dark:shadow-emerald-500/20 dark:hover:bg-emerald-600",
    btnSecondary:
      "hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
    badge: "bg-emerald-500/15 text-emerald-600",
    numActive: "bg-emerald-500/15 text-emerald-600",
    line: "via-emerald-500/25",
    tint: "bg-emerald-600/[0.04] dark:bg-emerald-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_160)] dark:bg-[oklch(0.15_0.01_160)]",
    cover:
      "bg-gradient-to-br from-emerald-500/[0.15] via-emerald-500/[0.06] to-transparent dark:from-emerald-400/[0.12] dark:via-emerald-400/[0.05]",
    coverGlyph: "text-emerald-500/[0.10] dark:text-emerald-400/[0.08]",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500/10",
    border: "border-rose-500/20",
    solid: "bg-rose-600 dark:bg-rose-500",
    shadow: "shadow-rose-600/20 dark:shadow-rose-500/20",
    hoverBorder: "hover:border-rose-500/20",
    hoverBg: "hover:bg-rose-500/[0.02] dark:hover:bg-rose-950/20",
    btnPrimary:
      "bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 dark:bg-rose-500 dark:shadow-rose-500/20 dark:hover:bg-rose-600",
    btnSecondary:
      "hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/20",
    badge: "bg-rose-500/15 text-rose-600",
    numActive: "bg-rose-500/15 text-rose-600",
    line: "via-rose-500/25",
    tint: "bg-rose-600/[0.04] dark:bg-rose-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_355)] dark:bg-[oklch(0.15_0.01_355)]",
    cover:
      "bg-gradient-to-br from-rose-500/[0.15] via-rose-500/[0.06] to-transparent dark:from-rose-400/[0.12] dark:via-rose-400/[0.05]",
    coverGlyph: "text-rose-500/[0.10] dark:text-rose-400/[0.08]",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    border: "border-amber-500/20",
    solid: "bg-amber-600 dark:bg-amber-500",
    shadow: "shadow-amber-600/20 dark:shadow-amber-500/20",
    hoverBorder: "hover:border-amber-500/20",
    hoverBg: "hover:bg-amber-500/[0.02] dark:hover:bg-amber-950/20",
    btnPrimary:
      "bg-amber-600 text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 dark:bg-amber-500 dark:shadow-amber-500/20 dark:hover:bg-amber-600",
    btnSecondary:
      "hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/20",
    badge: "bg-amber-500/15 text-amber-600",
    numActive: "bg-amber-500/15 text-amber-600",
    line: "via-amber-500/25",
    tint: "bg-amber-600/[0.04] dark:bg-amber-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_80)] dark:bg-[oklch(0.15_0.01_80)]",
    cover:
      "bg-gradient-to-br from-amber-500/[0.15] via-amber-500/[0.06] to-transparent dark:from-amber-400/[0.12] dark:via-amber-400/[0.05]",
    coverGlyph: "text-amber-500/[0.10] dark:text-amber-400/[0.08]",
  },
};

export function getAccent(color: AccentColor = "orange"): Accent {
  return accents[color];
}
