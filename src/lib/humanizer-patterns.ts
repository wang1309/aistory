import { HUMANIZER_PATTERNS_EN } from "./humanizer-patterns-en";
import { HUMANIZER_PATTERNS_JA } from "./humanizer-patterns-ja";
import { HUMANIZER_PATTERNS_KO } from "./humanizer-patterns-ko";
import { HUMANIZER_PATTERNS_ZH } from "./humanizer-patterns-zh";

export type HumanizerPatternGroup =
  | "padding"
  | "rhythm"
  | "inflation"
  | "formatting"
  | "chat-residue"
  | "language-specific";

export interface HumanizerPattern {
  /** Stable id shared by prompt construction and frontend labels, e.g. "zh-a1", "en-padding-01". */
  id: string;
  group: HumanizerPatternGroup;
  /** i18n key for the user-facing short label, e.g. "patterns.zh_a1.label". */
  labelKey: string;
  /** English guidance fed to the LLM to judge whether this pattern genuinely applies. */
  llmGuidance: string;
  /** Optional short before/after example to calibrate the LLM's judgment. */
  example?: { before: string; after: string };
}

export interface HumanizerLanguagePack {
  lang: string;
  /** Whole-passage tone/voice/rhythm guidance, distinct from discrete patterns. */
  toneNote: string;
  patterns: HumanizerPattern[];
}

export const HUMANIZER_LANGUAGE_PACKS: Record<string, HumanizerLanguagePack> = {
  zh: HUMANIZER_PATTERNS_ZH,
  en: HUMANIZER_PATTERNS_EN,
  ja: HUMANIZER_PATTERNS_JA,
  ko: HUMANIZER_PATTERNS_KO,
};

export const HUMANIZER_SUPPORTED_LANGS = Object.keys(
  HUMANIZER_LANGUAGE_PACKS
) as Array<keyof typeof HUMANIZER_LANGUAGE_PACKS>;

/** Unsupported languages fall back to the English pack rather than rejecting the request. */
export function getHumanizerPatterns(lang: string): HumanizerLanguagePack {
  return HUMANIZER_LANGUAGE_PACKS[lang] ?? HUMANIZER_LANGUAGE_PACKS.en;
}

export function getHumanizerPatternById(
  lang: string,
  patternId: string
): HumanizerPattern | undefined {
  return getHumanizerPatterns(lang).patterns.find((pattern) => pattern.id === patternId);
}
