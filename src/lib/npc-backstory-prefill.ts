import type { NpcCard } from "@/lib/npc-generator";

export const NPC_BACKSTORY_PREFILL_KEY = "npc-generator:dnd-backstory-prefill";

export interface NpcBackstoryPrefill {
  race: string;
  characterClass: string;
  background: string;
  prompt: string;
  motivation: string;
  secret: string;
  hookType: string;
  useCase: "npc";
}

export interface SessionStorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

function buildNpcBackstoryPrompt(card: Omit<NpcCard, "statBlock">): string {
  const parts = [
    `Continue the story of ${card.name}`,
    `Appearance: ${card.appearance}`,
    `Mannerism: ${card.mannerism}`,
    `Personality: ${card.personality}`,
    `Motivation: ${card.motivation}`,
    `Secret: ${card.secret}`,
    `Hook: ${card.hook}`,
  ];
  return parts.join(". ");
}

export function buildNpcBackstoryPrefill(card: Omit<NpcCard, "statBlock">): NpcBackstoryPrefill {
  return {
    race: card.race,
    characterClass: card.role,
    background: card.role,
    prompt: buildNpcBackstoryPrompt(card),
    motivation: card.motivation,
    secret: card.secret,
    hookType: "mystery",
    useCase: "npc",
  };
}

function readNonEmptyString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function consumeNpcBackstoryPrefill(storage: SessionStorageLike): NpcBackstoryPrefill | null {
  const raw = storage.getItem(NPC_BACKSTORY_PREFILL_KEY);
  storage.removeItem(NPC_BACKSTORY_PREFILL_KEY);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const source = parsed as Record<string, unknown>;

  const fields = ["race", "characterClass", "background", "prompt", "motivation", "secret", "hookType"];
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = readNonEmptyString(source, field);
    if (!value) return null;
    values[field] = value;
  }

  if (source.useCase !== "npc") return null;

  return {
    race: values.race,
    characterClass: values.characterClass,
    background: values.background,
    prompt: values.prompt,
    motivation: values.motivation,
    secret: values.secret,
    hookType: values.hookType,
    useCase: "npc",
  };
}
