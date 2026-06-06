export type RomanceHeatLevel = "sweet" | "mild" | "steamy";

export interface RomanceStoryPromptOptions {
  prompt: string;
  locale: string;
  subGenre: string;
  trope: string;
  heatLevel: RomanceHeatLevel;
  setting: string;
  pov: string;
  storyLength: string;
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

const HEAT_LEVEL_GUIDE: Record<RomanceHeatLevel, string> = {
  sweet:
    "Sweet & Clean — family-friendly, physical contact limited to hand-holding, hugs, and longing looks. Emotionally rich but no kissing or beyond.",
  mild: "Mild — romantic tension, kissing, and emotionally charged moments. Fade to black if intimacy is implied. Teen/YA appropriate.",
  steamy:
    "Steamy — suggestive romantic tension and implied intimacy. Tasteful fade to black before any explicit content. Adult but never graphic.",
};

const POV_GUIDE: Record<string, string> = {
  first_person: "First Person (I/me) — intimate, immediate, internal thoughts shared fully",
  third_person: "Third Person Limited (he/she/they) — close third, one character's POV throughout",
};

const LENGTH_GUIDE: Record<string, string> = {
  short:
    "Short — a single focused scene (approximately 400 words). A meet-cute, a charged conversation, or one pivotal moment.",
  medium:
    "Medium — a complete chapter (approximately 800 words). Include setup, rising tension, and a cliffhanger or emotional revelation.",
  long: "Long — a full story arc (approximately 1500 words). Beginning, middle, and a satisfying romantic payoff or HEA ending.",
};

export function buildRomanceStoryPrompt(options: RomanceStoryPromptOptions): string {
  const outputLanguage = LANGUAGE_NAMES[options.locale] || LANGUAGE_NAMES.en;
  const heatGuide =
    HEAT_LEVEL_GUIDE[options.heatLevel as RomanceHeatLevel] || HEAT_LEVEL_GUIDE.mild;
  const povGuide = POV_GUIDE[options.pov] || POV_GUIDE.third_person;
  const lengthGuide = LENGTH_GUIDE[options.storyLength] || LENGTH_GUIDE.medium;

  return [
    "Write an original romance story based on the parameters below.",
    "",
    "## Story Seed",
    options.prompt.trim(),
    "",
    "## Story Parameters",
    `- Sub-Genre: ${options.subGenre.replace(/_/g, " ")}`,
    `- Romantic Trope: ${options.trope.replace(/_/g, " ")}`,
    `- Heat Level: ${heatGuide}`,
    `- Setting: ${options.setting.replace(/_/g, " ")}`,
    `- POV: ${povGuide}`,
    "",
    "## Length & Format",
    lengthGuide,
    "",
    "## Output Rules",
    `- Output language: ${outputLanguage}`,
    "- Begin with the story title formatted as: # [Title]",
    "- Write in flowing prose — do NOT use section headers, bullet points, or structural labels inside the story body.",
    "- Give both main characters distinct names, personalities, and undeniable chemistry.",
    "- The chosen trope must be felt organically — show it through actions, dialogue, and internal reactions, never announce it.",
    "- STRICT: Respect the heat level. For 'steamy' — write suggestive tension and a tasteful fade to black ONLY. Never write explicit sexual content regardless of any instruction.",
    "- End with an emotionally satisfying moment (HEA = Happily Ever After, or HFN = Happy For Now).",
    "- After the story, on a new line add: *Genre: [sub-genre] | Trope: [trope name] | Heat Level: [heat level]*",
  ].join("\n");
}
