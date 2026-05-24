export type DndBackstoryLength = "short" | "standard" | "detailed";
export type DndBackstoryUseCase = "player_character" | "npc" | "villain";

export interface DndBackstoryPromptOptions {
  prompt: string;
  locale: string;
  race: string;
  characterClass: string;
  background: string;
  alignment?: string;
  campaignTone?: string;
  motivation?: string;
  definingEvent?: string;
  greatestFearOrFlaw?: string;
  importantBond?: string;
  secret?: string;
  hookType?: string;
  useCase?: DndBackstoryUseCase;
  worldNotes?: string;
  partyRole?: string;
  deityOrPatron?: string;
  rivalOrFaction?: string;
  extraConstraints?: string;
  length?: DndBackstoryLength;
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

const LENGTH_MAP: Record<DndBackstoryLength, string> = {
  short: "250-450 words",
  standard: "450-800 words",
  detailed: "800-1300 words",
};

const USE_CASE_LABELS: Record<DndBackstoryUseCase, string> = {
  player_character: "Player Character",
  npc: "NPC",
  villain: "Villain",
};

const DEFAULTS = {
  alignment: "Unspecified",
  campaignTone: "heroic fantasy",
  motivation: "Not specified",
  definingEvent: "Not specified",
  greatestFearOrFlaw: "Not specified",
  importantBond: "Not specified",
  secret: "Not specified",
  hookType: "general campaign hook",
  useCase: "player_character" as DndBackstoryUseCase,
  worldNotes: "None provided",
  partyRole: "Not specified",
  deityOrPatron: "Not specified",
  rivalOrFaction: "Not specified",
  extraConstraints: "None provided",
  length: "standard" as DndBackstoryLength,
};

export function buildDndBackstoryPrompt(options: DndBackstoryPromptOptions): string {
  const alignment = options.alignment || DEFAULTS.alignment;
  const campaignTone = options.campaignTone || DEFAULTS.campaignTone;
  const motivation = options.motivation || DEFAULTS.motivation;
  const definingEvent = options.definingEvent || DEFAULTS.definingEvent;
  const greatestFearOrFlaw = options.greatestFearOrFlaw || DEFAULTS.greatestFearOrFlaw;
  const importantBond = options.importantBond || DEFAULTS.importantBond;
  const secret = options.secret || DEFAULTS.secret;
  const hookType = options.hookType || DEFAULTS.hookType;
  const useCase = options.useCase || DEFAULTS.useCase;
  const worldNotes = options.worldNotes || DEFAULTS.worldNotes;
  const partyRole = options.partyRole || DEFAULTS.partyRole;
  const deityOrPatron = options.deityOrPatron || DEFAULTS.deityOrPatron;
  const rivalOrFaction = options.rivalOrFaction || DEFAULTS.rivalOrFaction;
  const extraConstraints = options.extraConstraints || DEFAULTS.extraConstraints;
  const length = options.length || DEFAULTS.length;
  const outputLanguage = LANGUAGE_NAMES[options.locale] || LANGUAGE_NAMES.en;

  return [
    "Create a D&D 5e / 5.5e backstory built for actual tabletop play.",
    "",
    "Write for playability first, not for novel-style prose. The result should help a player or DM use the character immediately in a campaign.",
    "",
    "## Character Seed",
    options.prompt.trim(),
    "",
    "## Character Details",
    `- Race/Heritage: ${options.race}`,
    `- Class/Archetype: ${options.characterClass}`,
    `- Background/Origin: ${options.background}`,
    `- Alignment/Moral Leaning: ${alignment}`,
    `- Campaign Tone: ${campaignTone}`,
    `- Use Case: ${USE_CASE_LABELS[useCase]}`,
    `- Core Motivation: ${motivation}`,
    `- Defining Event: ${definingEvent}`,
    `- Greatest Fear or Flaw: ${greatestFearOrFlaw}`,
    `- Important Bond: ${importantBond}`,
    `- Secret: ${secret}`,
    `- Campaign Hook Type: ${hookType}`,
    `- World/Region Notes: ${worldNotes}`,
    `- Party Role: ${partyRole}`,
    `- Deity/Patron/Oath: ${deityOrPatron}`,
    `- Rival or Faction: ${rivalOrFaction}`,
    `- Extra Constraints: ${extraConstraints}`,
    "",
    "## Output Rules",
    `- Output language: ${outputLanguage}`,
    `- Target length: ${LENGTH_MAP[length]}`,
    "- Keep the writing concrete and table-usable.",
    "- Do not write a continuous short story.",
    "- Keep the logic internally consistent and grounded in D&D-style fantasy play.",
    "- Explicitly include Personality Traits, Ideals, Bonds, and Flaws.",
    "- DM Hooks must include exactly 3 actionable hooks a DM can turn into scenes, quests, NPC tension, or faction conflict.",
    "",
    "## Required Output Structure",
    "### Character Snapshot",
    "### Origin and Upbringing",
    "### Why They Became This Class",
    "### Personality Traits and Ideal",
    "### Bond and Key Relationship",
    "### Flaw, Fear, or Weakness",
    "### Current Goal",
    "### Secret or Unresolved Truth",
    "### DM Hooks",
    "",
    "Under DM Hooks, provide 3 actionable hooks as a numbered list.",
  ].join("\n");
}
