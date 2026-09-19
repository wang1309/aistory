export type NpcGameSystem = "fantasy" | "dnd5e";
export type NpcCrTier = "commoner" | "trained" | "veteran" | "elite";
export type NpcArchetype = "martial" | "skilled" | "spellcaster" | "common";

export type NpcField =
  | "name"
  | "race"
  | "role"
  | "appearance"
  | "mannerism"
  | "personality"
  | "motivation"
  | "secret"
  | "hook"
  | "statBlock";

export interface NpcGenerationOptions {
  system: NpcGameSystem;
  race: string;
  presentation: string;
  role: string;
  tone: string;
  crTier: NpcCrTier;
}

export interface Dnd5eNpcStatBlock {
  armorClass: number;
  hitPoints: number;
  speed: string;
  abilities: Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>;
  passivePerception: number;
  languages: string[];
  challengeRating: string;
  actions: Array<{ name: string; text: string }>;
}

export interface NpcCard {
  name: string;
  race: string;
  presentation: string;
  role: string;
  appearance: string;
  mannerism: string;
  personality: string;
  motivation: string;
  secret: string;
  hook: string;
  statBlock?: Dnd5eNpcStatBlock;
}

export type NpcRandom = () => number;

export interface NpcGeneratorData {
  names: { given: string[]; family: string[] };
  races: Array<{ value: string; label: string }>;
  presentations: Array<{ value: string; label: string }>;
  roles: Array<{ value: string; label: string; archetype: NpcArchetype }>;
  tones: Array<{ value: string; label: string }>;
  appearances: string[];
  mannerisms: string[];
  personalities: string[];
  motivations: string[];
  secrets: string[];
  hooks: string[];
  dnd5eTemplates: Partial<Record<NpcArchetype, Partial<Record<NpcCrTier, Dnd5eNpcStatBlock>>>>;
}

export function secureNpcRandom(): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
}

function pick<T>(field: string, values: T[], random: NpcRandom): T {
  if (values.length === 0) {
    throw new Error(`NPC generator data has no eligible ${field}`);
  }
  const index = Math.min(values.length - 1, Math.floor(random() * values.length));
  return values[index];
}

function filterOptions<T extends { value: string }>(options: T[], selector: string): T[] {
  if (selector === "random") {
    return options.filter((option) => option.value !== "random");
  }
  return options.filter((option) => option.value === selector);
}

function cloneStatBlock(block: Dnd5eNpcStatBlock): Dnd5eNpcStatBlock {
  return {
    ...block,
    abilities: { ...block.abilities },
    languages: [...block.languages],
    actions: block.actions.map((action) => ({ ...action })),
  };
}

function resolveStatBlock(data: NpcGeneratorData, archetype: NpcArchetype, crTier: NpcCrTier): Dnd5eNpcStatBlock {
  const template = data.dnd5eTemplates[archetype]?.[crTier];
  if (!template) {
    throw new Error(`NPC generator data has no dnd5e template for archetype "${archetype}" at CR tier "${crTier}"`);
  }
  return cloneStatBlock(template);
}

export function generateNpcCard(
  options: NpcGenerationOptions,
  data: NpcGeneratorData,
  random: NpcRandom = Math.random
): NpcCard {
  const given = pick("given names", data.names.given, random);
  const family = pick("family names", data.names.family, random);
  const race = pick("races", filterOptions(data.races, options.race), random);
  const presentation = pick("presentations", filterOptions(data.presentations, options.presentation), random);
  const role = pick("roles", filterOptions(data.roles, options.role), random);
  const appearance = pick("appearances", data.appearances, random);
  const mannerism = pick("mannerisms", data.mannerisms, random);
  const personality = pick("personalities", data.personalities, random);
  const motivation = pick("motivations", data.motivations, random);
  const secret = pick("secrets", data.secrets, random);
  const hook = pick("hooks", data.hooks, random);

  const card: NpcCard = {
    name: `${given} ${family}`,
    race: race.label,
    presentation: presentation.label,
    role: role.label,
    appearance,
    mannerism,
    personality,
    motivation,
    secret,
    hook,
  };

  if (options.system === "dnd5e") {
    card.statBlock = resolveStatBlock(data, role.archetype, options.crTier);
  }

  return card;
}

export function rerollNpcField(
  card: NpcCard,
  field: NpcField,
  options: NpcGenerationOptions,
  data: NpcGeneratorData,
  random: NpcRandom = Math.random
): NpcCard {
  const fresh = generateNpcCard(options, data, random);
  const next: NpcCard = { ...card };
  if (field === "statBlock") {
    next.statBlock = fresh.statBlock;
  } else {
    next[field] = fresh[field];
  }
  return next;
}

export function mergeLockedFields(
  previous: NpcCard,
  next: NpcCard,
  lockedFields: ReadonlySet<NpcField>,
  system: NpcGameSystem
): NpcCard {
  const merged = { ...next };
  for (const field of lockedFields) {
    if (field === "statBlock") {
      if (system === "dnd5e") merged.statBlock = previous.statBlock;
      continue;
    }
    merged[field] = previous[field];
  }
  return merged;
}

function formatAbilities(abilities: Dnd5eNpcStatBlock["abilities"]): string {
  return `STR ${abilities.str}, DEX ${abilities.dex}, CON ${abilities.con}, INT ${abilities.int}, WIS ${abilities.wis}, CHA ${abilities.cha}`;
}

export function buildNpcMarkdown(card: NpcCard): string {
  const lines: string[] = [
    `## ${card.name}`,
    "",
    `- **Race:** ${card.race}`,
    `- **Presentation:** ${card.presentation}`,
    `- **Role:** ${card.role}`,
    `- **Appearance:** ${card.appearance}`,
    `- **Mannerism:** ${card.mannerism}`,
    `- **Personality:** ${card.personality}`,
    `- **Motivation:** ${card.motivation}`,
    `- **Secret:** ${card.secret}`,
    `- **Hook:** ${card.hook}`,
  ];

  const statBlock = card.statBlock;
  if (statBlock) {
    lines.push(
      "",
      "## Stat Block",
      "",
      `- **Armor Class:** ${statBlock.armorClass}`,
      `- **Hit Points:** ${statBlock.hitPoints}`,
      `- **Speed:** ${statBlock.speed}`,
      `- **Abilities:** ${formatAbilities(statBlock.abilities)}`,
      `- **Passive Perception:** ${statBlock.passivePerception}`,
      `- **Languages:** ${statBlock.languages.join(", ")}`,
      `- **Challenge Rating:** ${statBlock.challengeRating}`,
      "",
      "### Actions"
    );
    for (const action of statBlock.actions) {
      lines.push(`- **${action.name}.** ${action.text}`);
    }
  }

  return lines.join("\n");
}

export function buildNpcPlainText(card: NpcCard): string {
  const lines: string[] = [
    card.name,
    `Race: ${card.race}`,
    `Presentation: ${card.presentation}`,
    `Role: ${card.role}`,
    `Appearance: ${card.appearance}`,
    `Mannerism: ${card.mannerism}`,
    `Personality: ${card.personality}`,
    `Motivation: ${card.motivation}`,
    `Secret: ${card.secret}`,
    `Hook: ${card.hook}`,
  ];

  const statBlock = card.statBlock;
  if (statBlock) {
    lines.push(
      "",
      "Stat Block",
      `Armor Class: ${statBlock.armorClass}`,
      `Hit Points: ${statBlock.hitPoints}`,
      `Speed: ${statBlock.speed}`,
      `Abilities: ${formatAbilities(statBlock.abilities)}`,
      `Passive Perception: ${statBlock.passivePerception}`,
      `Languages: ${statBlock.languages.join(", ")}`,
      `Challenge Rating: ${statBlock.challengeRating}`,
      "",
      "Actions"
    );
    for (const action of statBlock.actions) {
      lines.push(`- ${action.name}: ${action.text}`);
    }
  }

  return lines.join("\n");
}
