export type MurderMysteryComplexity = "simple" | "standard" | "complex";

export interface MurderMysteryPromptOptions {
  prompt: string;
  locale: string;
  settingType: string;
  timePeriod: string;
  playerCount: string;
  complexity: MurderMysteryComplexity;
  mysteryType: string;
  tone: string;
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

const COMPLEXITY_GUIDE: Record<MurderMysteryComplexity, string> = {
  simple:
    "Simple: One murderer, a clear motive, 3-4 suspects. Suitable for first-timers and short sessions (1-2 hours).",
  standard:
    "Standard: One murderer, 2 red herrings, 5-7 suspects, layered clues. Good for mixed groups (2-3 hours).",
  complex:
    "Complex: One murderer with a hidden accomplice, multiple overlapping motives, 8-10 suspects, a major plot twist mid-game. For experienced players (3-4 hours).",
};

export function buildMurderMysteryPrompt(options: MurderMysteryPromptOptions): string {
  const outputLanguage = LANGUAGE_NAMES[options.locale] || LANGUAGE_NAMES.en;
  const complexityGuide = COMPLEXITY_GUIDE[options.complexity];

  return [
    "Create a complete, ready-to-play murder mystery scenario for a party game.",
    "",
    "## Scenario Seed",
    options.prompt.trim(),
    "",
    "## Game Parameters",
    `- Setting: ${options.settingType}`,
    `- Time Period: ${options.timePeriod}`,
    `- Player Count: ${options.playerCount}`,
    `- Mystery Type: ${options.mysteryType}`,
    `- Tone: ${options.tone}`,
    `- Complexity: ${complexityGuide}`,
    "",
    "## Output Rules",
    `- Output language: ${outputLanguage}`,
    "- Write for a host (Game Master) who will run this as a party game.",
    "- Every suspect must have a believable motive AND an alibi (some true, some false).",
    "- Clues must be fair — the killer can be deduced from evidence alone.",
    "- Do NOT reveal the killer until the Solution section, clearly marked.",
    "- Keep character descriptions vivid but concise (2-3 sentences each).",
    "",
    "## Required Output Structure",
    "",
    "### The Crime",
    "(Who was killed, where, when, and how — discovered circumstances only, no solution yet)",
    "",
    "### The Victim",
    "(Name, role/occupation, personality, who might want them dead and why)",
    "",
    "### Suspects",
    "(For each suspect: Name, Role, Personality, Motive, Alibi, Secret they're hiding)",
    "",
    "### Clues & Evidence",
    "(8-12 clues, each numbered. Include physical evidence, testimonies, and at least 2 red herrings. Mark red herrings as [Red Herring] after the solution section only)",
    "",
    "### How to Run This Mystery",
    "(Host tips: scene setup, how to distribute clues, suggested round structure)",
    "",
    "### ⚠️ SOLUTION — Host Eyes Only",
    "(The killer's identity, their exact method, their true motive, and which clues prove guilt. Explain why each red herring was misleading.)",
  ].join("\n");
}
