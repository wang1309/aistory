export type AccentColor =
  | "orange"
  | "teal"
  | "pink"
  | "blue"
  | "cyan"
  | "violet"
  | "emerald"
  | "indigo"
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
  },
  pink: {
    text: "text-pink-600 dark:text-pink-400",
    iconBg: "bg-pink-500/10",
    border: "border-pink-500/20",
    solid: "bg-pink-600 dark:bg-pink-500",
    shadow: "shadow-pink-600/20 dark:shadow-pink-500/20",
    hoverBorder: "hover:border-pink-500/20",
    hoverBg: "hover:bg-pink-500/[0.02] dark:hover:bg-pink-950/20",
    btnPrimary:
      "bg-pink-600 text-white shadow-md shadow-pink-600/20 hover:bg-pink-700 dark:bg-pink-500 dark:shadow-pink-500/20 dark:hover:bg-pink-600",
    btnSecondary:
      "hover:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-pink-950/20",
    badge: "bg-pink-500/15 text-pink-600",
    numActive: "bg-pink-500/15 text-pink-600",
    line: "via-pink-500/25",
    tint: "bg-pink-600/[0.04] dark:bg-pink-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_345)] dark:bg-[oklch(0.15_0.01_345)]",
  },
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    border: "border-blue-500/20",
    solid: "bg-blue-600 dark:bg-blue-500",
    shadow: "shadow-blue-600/20 dark:shadow-blue-500/20",
    hoverBorder: "hover:border-blue-500/20",
    hoverBg: "hover:bg-blue-500/[0.02] dark:hover:bg-blue-950/20",
    btnPrimary:
      "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 dark:bg-blue-500 dark:shadow-blue-500/20 dark:hover:bg-blue-600",
    btnSecondary:
      "hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950/20",
    badge: "bg-blue-500/15 text-blue-600",
    numActive: "bg-blue-500/15 text-blue-600",
    line: "via-blue-500/25",
    tint: "bg-blue-600/[0.04] dark:bg-blue-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_260)] dark:bg-[oklch(0.15_0.01_260)]",
  },
  cyan: {
    text: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    solid: "bg-cyan-600 dark:bg-cyan-500",
    shadow: "shadow-cyan-600/20 dark:shadow-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/20",
    hoverBg: "hover:bg-cyan-500/[0.02] dark:hover:bg-cyan-950/20",
    btnPrimary:
      "bg-cyan-600 text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700 dark:bg-cyan-500 dark:shadow-cyan-500/20 dark:hover:bg-cyan-600",
    btnSecondary:
      "hover:border-cyan-500/30 hover:bg-cyan-50 dark:hover:bg-cyan-950/20",
    badge: "bg-cyan-500/15 text-cyan-600",
    numActive: "bg-cyan-500/15 text-cyan-600",
    line: "via-cyan-500/25",
    tint: "bg-cyan-600/[0.04] dark:bg-cyan-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_195)] dark:bg-[oklch(0.15_0.01_195)]",
  },
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500/10",
    border: "border-violet-500/20",
    solid: "bg-violet-600 dark:bg-violet-500",
    shadow: "shadow-violet-600/20 dark:shadow-violet-500/20",
    hoverBorder: "hover:border-violet-500/20",
    hoverBg: "hover:bg-violet-500/[0.02] dark:hover:bg-violet-950/20",
    btnPrimary:
      "bg-violet-600 text-white shadow-md shadow-violet-600/20 hover:bg-violet-700 dark:bg-violet-500 dark:shadow-violet-500/20 dark:hover:bg-violet-600",
    btnSecondary:
      "hover:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-950/20",
    badge: "bg-violet-500/15 text-violet-600",
    numActive: "bg-violet-500/15 text-violet-600",
    line: "via-violet-500/25",
    tint: "bg-violet-600/[0.04] dark:bg-violet-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_290)] dark:bg-[oklch(0.15_0.01_290)]",
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
  },
  indigo: {
    text: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    solid: "bg-indigo-600 dark:bg-indigo-500",
    shadow: "shadow-indigo-600/20 dark:shadow-indigo-500/20",
    hoverBorder: "hover:border-indigo-500/20",
    hoverBg: "hover:bg-indigo-500/[0.02] dark:hover:bg-indigo-950/20",
    btnPrimary:
      "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 dark:bg-indigo-500 dark:shadow-indigo-500/20 dark:hover:bg-indigo-600",
    btnSecondary:
      "hover:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/20",
    badge: "bg-indigo-500/15 text-indigo-600",
    numActive: "bg-indigo-500/15 text-indigo-600",
    line: "via-indigo-500/25",
    tint: "bg-indigo-600/[0.04] dark:bg-indigo-500/[0.06]",
    sectionBg: "bg-[oklch(0.98_0.01_270)] dark:bg-[oklch(0.15_0.01_270)]",
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
  },
};

export function getAccent(color: AccentColor = "orange"): Accent {
  return accents[color];
}
