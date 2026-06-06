export type BedtimeStoryLength = "short" | "medium" | "long";
export type BedtimeStoryAgeGroup = "toddler" | "preschool" | "early_reader" | "middle_grade";

export interface BedtimeStoryPromptOptions {
  prompt: string;
  locale: string;
  ageGroup: BedtimeStoryAgeGroup;
  storyTheme: string;
  length: BedtimeStoryLength;
  endingMood: string;
  moralLesson?: string;
  childName?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  de: "German",
  ru: "Russian",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  it: "Italian",
};

const LENGTH_MAP: Record<BedtimeStoryLength, string> = {
  short: "300-500 words (3-5 minute read-aloud)",
  medium: "600-900 words (7-10 minute read-aloud)",
  long: "1000-1400 words (12-15 minute read-aloud)",
};

const AGE_GUIDELINES: Record<BedtimeStoryAgeGroup, string> = {
  toddler:
    "Ages 2-3. Very simple sentences. Repetition is good. Basic vocabulary. Short paragraphs of 1-2 sentences. Characters are animals or familiar objects.",
  preschool:
    "Ages 4-5. Simple sentences with a little variety. Fun words and gentle rhythm. Clear cause-and-effect. Friendly animal or child protagonists.",
  early_reader:
    "Ages 6-8. Short paragraphs. Mild adventure with no scary content. Relatable characters. Small challenges resolved with cleverness or kindness.",
  middle_grade:
    "Ages 9-12. Longer sentences and richer vocabulary. A real problem to solve. More detailed world-building but still appropriate and calming before sleep.",
};

export function buildBedtimeStoryPrompt(options: BedtimeStoryPromptOptions): string {
  const outputLanguage = LANGUAGE_NAMES[options.locale] || LANGUAGE_NAMES.en;
  const lengthGuide = LENGTH_MAP[options.length];
  const ageGuide = AGE_GUIDELINES[options.ageGroup];
  const childNameLine = options.childName?.trim()
    ? `- Personalize for child named: ${options.childName.trim()}`
    : "";
  const moralLine =
    options.moralLesson && options.moralLesson !== "none"
      ? `- Weave in this moral lesson naturally (do not state it explicitly): ${options.moralLesson}`
      : "- No specific moral required, just a satisfying, cozy ending.";

  return [
    "Write an original bedtime story for children.",
    "",
    "## Story Idea",
    options.prompt.trim(),
    "",
    "## Story Parameters",
    `- Theme: ${options.storyTheme}`,
    `- Ending mood: ${options.endingMood}`,
    moralLine,
    childNameLine,
    "",
    "## Age and Language",
    ageGuide,
    "",
    "## Output Rules",
    `- Output language: ${outputLanguage}`,
    `- Target length: ${lengthGuide}`,
    "- Begin with an engaging first sentence that immediately sets the scene.",
    "- Keep the tone warm, gentle, and reassuring throughout.",
    "- End the story with a calming, satisfying conclusion that helps children wind down for sleep.",
    "- Do NOT include violence, scary elements, or content inappropriate for children.",
    "- Write in flowing narrative prose with natural paragraph breaks.",
    "- Give the story a title on the first line, formatted as: # [Title]",
  ].filter(Boolean).join("\n");
}
