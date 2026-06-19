export interface IncorrectQuoteRandomPreset {
  prompt: string;
  characters: string[];
}

const FALLBACK_RANDOM_PRESETS: IncorrectQuoteRandomPreset[] = [
  {
    prompt: "The team is trying to explain why the kitchen fire definitely counts as a tactical success.",
    characters: ["Avery", "Kai", "Mina"],
  },
  {
    prompt: "Two rivals are forced to co-host a school announcement and neither agrees on the script.",
    characters: ["Rin", "Sol"],
  },
  {
    prompt: "The healer has been banned from motivational speeches after one very specific incident.",
    characters: ["Noor", "Bea", "Ilan"],
  },
  {
    prompt: "A found-family crew is trying to look normal in public for exactly thirty seconds.",
    characters: ["Jules", "Nia", "Pax", "Ivy"],
  },
];

function cleanText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizePreset(
  preset: IncorrectQuoteRandomPreset
): IncorrectQuoteRandomPreset | null {
  const prompt = cleanText(preset.prompt);
  const characters = preset.characters
    .map((name) => cleanText(name))
    .filter(Boolean)
    .slice(0, 6);

  if (!prompt || characters.length < 2) {
    return null;
  }

  return {
    prompt,
    characters,
  };
}

export function pickRandomIncorrectQuotePreset({
  presets,
  randomValue = Math.random(),
}: {
  presets: IncorrectQuoteRandomPreset[];
  randomValue?: number;
}): IncorrectQuoteRandomPreset {
  const normalizedPresets = presets
    .map(normalizePreset)
    .filter((preset): preset is IncorrectQuoteRandomPreset => !!preset);
  const pool = normalizedPresets.length > 0 ? normalizedPresets : FALLBACK_RANDOM_PRESETS;
  const clampedRandom = Math.min(Math.max(randomValue, 0), 0.999999);
  const index = Math.floor(clampedRandom * pool.length);

  return pool[index];
}
