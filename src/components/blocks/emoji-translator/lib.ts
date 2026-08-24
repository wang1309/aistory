import type {
  EmojiTranslatorMode,
  EmojiTranslatorScenario,
  EmojiTranslatorTone,
} from "@/types/emoji-translator";
import type { EmojiTranslatorRandomPreset } from "@/types/blocks/emoji-translator";

interface RequiredRandomPreset {
  text: string;
  context: string;
  mode: EmojiTranslatorMode;
  scenario: EmojiTranslatorScenario;
  tone: EmojiTranslatorTone;
}

const FALLBACK_RANDOM_PRESETS: RequiredRandomPreset[] = [
  {
    text: "Morning coffee and a good book. This is my happy place.",
    context: "Instagram caption",
    mode: "add",
    scenario: "caption",
    tone: "subtle",
  },
  {
    text: "Are you free this weekend? Let's do something fun together.",
    context: "texting a close friend",
    mode: "add",
    scenario: "chat_reply",
    tone: "playful",
  },
  {
    text: "I finally finished the project I've been working on for months.",
    context: "social media announcement",
    mode: "translate",
    scenario: "caption",
    tone: "bold",
  },
];

function cleanText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizePreset(preset: EmojiTranslatorRandomPreset): RequiredRandomPreset | null {
  const text = cleanText(preset.text);

  if (!text) {
    return null;
  }

  return {
    text,
    context: cleanText(preset.context),
    mode: preset.mode ?? "add",
    scenario: preset.scenario ?? "chat_reply",
    tone: preset.tone ?? "subtle",
  };
}

export function pickRandomEmojiTranslatorPreset({
  presets,
  randomValue = Math.random(),
}: {
  presets: EmojiTranslatorRandomPreset[];
  randomValue?: number;
}): RequiredRandomPreset {
  const normalized = presets
    .map(normalizePreset)
    .filter((preset): preset is RequiredRandomPreset => preset !== null);

  const pool = normalized.length > 0 ? normalized : FALLBACK_RANDOM_PRESETS;
  const clampedRandom = Math.min(Math.max(randomValue, 0), 0.999999);
  const index = Math.floor(clampedRandom * pool.length);

  return pool[index];
}
