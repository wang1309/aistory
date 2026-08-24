import type {
  BandGenre,
  BandMode,
  BandModelMode,
  BandNameGeneratorResponse,
  BandNameLength,
  BandOutputLocale,
  BandTemplateIdea,
  BandVibe,
  NormalizedBandNameRequest,
} from "@/types/band-name-generator";

const GENRES = [
  "rock",
  "metal",
  "indie",
  "emo",
  "pop",
  "electronic",
  "hip_hop",
] as const;
const VIBES = [
  "anthemic",
  "gritty",
  "dreamy",
  "playful",
  "dark",
  "nostalgic",
] as const;
const LENGTHS = ["any", "one_word", "short", "phrase"] as const;
const MODES = ["ai", "template"] as const;
const MODEL_MODES = ["fast", "standard", "creative"] as const;
const OUTPUT_LOCALES = ["en", "zh", "de", "ko", "ja", "ru"] as const;

const MAX_CUE = 120;
const MAX_INSPIRATION_NAME = 100;
export const TEMPLATE_IDEA_COUNT = 6;

const OUTPUT_LANGUAGES = {
  en: "English",
  zh: "Simplified Chinese",
  de: "German",
  ko: "Korean",
  ja: "Japanese",
  ru: "Russian",
} as const;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isAllowed<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

/**
 * Resolve a closed control: absent values fall back to the default, supplied
 * values must be one of the allowed options.
 */
function resolveControl<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T | null {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return isAllowed(value, allowed) ? value : null;
}

export function validateBandNameRequest(input: {
  genre?: unknown;
  vibe?: unknown;
  length?: unknown;
  mode?: unknown;
  modelMode?: unknown;
  cue?: unknown;
  inspirationName?: unknown;
  locale?: unknown;
}): { ok: true; value: NormalizedBandNameRequest } | { ok: false; message: string } {
  const genre = resolveControl(input.genre, GENRES, "rock");
  if (!genre) return { ok: false, message: "Unsupported genre." };

  const vibe = resolveControl(input.vibe, VIBES, "anthemic");
  if (!vibe) return { ok: false, message: "Unsupported vibe." };

  const length = resolveControl(input.length, LENGTHS, "any");
  if (!length) return { ok: false, message: "Unsupported name length." };

  const mode = resolveControl(input.mode, MODES, "ai");
  if (!mode) return { ok: false, message: "Unsupported mode." };

  const modelMode = resolveControl(input.modelMode, MODEL_MODES, "standard");
  if (!modelMode) return { ok: false, message: "Unsupported model mode." };

  const locale = resolveControl(input.locale, OUTPUT_LOCALES, "en");
  if (!locale) return { ok: false, message: "Unsupported locale." };

  const cue = clean(input.cue);
  if (cue.length > MAX_CUE) {
    return {
      ok: false,
      message: `Cue must be ${MAX_CUE} characters or fewer.`,
    };
  }

  const inspirationName = clean(input.inspirationName);
  if (inspirationName.length > MAX_INSPIRATION_NAME) {
    return {
      ok: false,
      message: `Inspiration name must be ${MAX_INSPIRATION_NAME} characters or fewer.`,
    };
  }

  return {
    ok: true,
    value: {
      genre,
      vibe,
      length,
      mode,
      modelMode,
      cue,
      inspirationName,
      locale,
    },
  };
}

function genreLine(genre: BandGenre): string {
  switch (genre) {
    case "rock":
      return "Genre 'rock': guitar-driven rock — names that sound loud, classic, and playable on a marquee (hard rock, classic rock, garage).";
    case "metal":
      return "Genre 'metal': heavy music — names with weight, menace, and myth (heavy, thrash, doom, prog metal).";
    case "indie":
      return "Genre 'indie': indie and alternative — names that feel handmade, wry, and intimate (indie rock, indie pop, lo-fi).";
    case "emo":
      return "Genre 'emo': emo and post-hardcore — names that wear feeling on their sleeve: confession, nostalgia, and hurt.";
    case "pop":
      return "Genre 'pop': pop — names that are bright, memorable, and easy to chant along to.";
    case "electronic":
      return "Genre 'electronic': electronic and dance — names built from texture, machines, and atmosphere (house, techno, synthwave, EDM).";
    case "hip_hop":
      return "Genre 'hip_hop': hip-hop and rap — names with swagger, place, and wordplay (boom bap, trap, alternative hip-hop).";
  }
}

function vibeLine(vibe: BandVibe): string {
  switch (vibe) {
    case "anthemic":
      return "Vibe 'anthemic': big, uplifting, festival-mainstage energy — the name should sound huge shouted by a crowd.";
    case "gritty":
      return "Vibe 'gritty': worn, honest, club-floor realism — the name should sound like a working band.";
    case "dreamy":
      return "Vibe 'dreamy': hazy, floating, reverb-soaked — the name should feel soft-focus and atmospheric.";
    case "playful":
      return "Vibe 'playful': witty and light — a name with a smirk that still takes the music seriously.";
    case "dark":
      return "Vibe 'dark': shadowy and intense — the name should lower the temperature of the room.";
    case "nostalgic":
      return "Vibe 'nostalgic': evokes a specific era or memory — cassette, neon, hometown, late-night radio feelings.";
  }
}

function lengthLine(length: BandNameLength): string {
  switch (length) {
    case "any":
      return "Name length: any — mix one-word names and short phrases across the six directions.";
    case "one_word":
      return "Name length 'one_word': every name must be a single word (a real word, a compound, or an invented word that reads naturally).";
    case "short":
      return "Name length 'short': every name must be two words, no 'The', no ampersand.";
    case "phrase":
      return "Name length 'phrase': every name may be a longer phrase of three to five words, like a full band-name sentence.";
  }
}

export function buildBandNamePrompt(input: NormalizedBandNameRequest): string {
  const language = OUTPUT_LANGUAGES[input.locale];

  return [
    "You are a band-identity consultant for independent musicians and creators. Produce exactly 6 distinct band-name identity directions a new band could evaluate today.",
    "Return valid JSON only. JSON only, no prose before or after.",
    genreLine(input.genre),
    vibeLine(input.vibe),
    lengthLine(input.length),
    `Anchor words from the musician (optional — a keyword, city, era, or influence to honor): ${input.cue || "not provided"}`,
    input.inspirationName
      ? `Inspiration: create names that share the sound and feel of "${input.inspirationName}" without copying or slightly editing it.`
      : "Inspiration: not provided.",
    `Write the pronunciation, rationale, genreFit, bio, and visualDirection values in ${language}. Shape each 'name' so readers of that language can read and say it out loud.`,
    "Every name must be entirely original and invented for this response. Never reproduce, adapt, or clearly echo the name of a real band, artist, label, song, or franchise.",
    "Never reference real people, living or historical. Keep names safe for a real band to carry: no slurs, hate symbols, or shock-value references.",
    "The six directions must be genuinely different from each other — vary structure (one word vs. phrase), register, and imagery.",
    "Each direction requires the fields: name (the band name, capitalized naturally), pronunciation (one short sentence on how to say it and how it reads), rationale (one sentence on why the name works), genreFit (2-6 words on how it serves the chosen genre), bio (one-sentence band bio in the band's own voice), and visualDirection (2-8 words of art direction for a logo or first promo shot).",
    'Output shape: {"ideas":[{"name":"","pronunciation":"","rationale":"","genreFit":"","bio":"","visualDirection":""}]}',
  ].join("\n");
}

function unwrapFenced(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? raw.trim();
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseBandNameResponse(
  raw: string
): Extract<BandNameGeneratorResponse, { mode: "ai" }> {
  const jsonText = unwrapFenced(raw);
  const parsed = JSON.parse(jsonText) as { ideas?: unknown };

  const list = Array.isArray(parsed.ideas) ? parsed.ideas : [];
  const mapped = list
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (
        !isNonEmpty(obj.name) ||
        !isNonEmpty(obj.pronunciation) ||
        !isNonEmpty(obj.rationale) ||
        !isNonEmpty(obj.genreFit) ||
        !isNonEmpty(obj.bio) ||
        !isNonEmpty(obj.visualDirection)
      ) {
        return null;
      }
      return {
        name: obj.name.trim(),
        pronunciation: obj.pronunciation.trim(),
        rationale: obj.rationale.trim(),
        genreFit: obj.genreFit.trim(),
        bio: obj.bio.trim(),
        visualDirection: obj.visualDirection.trim(),
      };
    })
    .filter((item) => item !== null);

  if (mapped.length !== TEMPLATE_IDEA_COUNT) {
    throw new Error("Expected six complete ideas");
  }

  return {
    mode: "ai",
    ideas: mapped as unknown as Extract<
      BandNameGeneratorResponse,
      { mode: "ai" }
    >["ideas"],
  };
}

export function resolveBandModelConfig(modelMode: BandModelMode): {
  modelName: string;
  temperature: number;
} {
  switch (modelMode) {
    case "fast":
      return {
        modelName: "gemini-2.5-flash",
        temperature: 0.7,
      };
    case "creative":
      return {
        modelName: "gemini-3-flash",
        temperature: 0.9,
      };
    case "standard":
    default:
      return {
        modelName: "gemini-3.1-flash-lite",
        temperature: 0.75,
      };
  }
}

export async function generateBandNames(
  input: NormalizedBandNameRequest
): Promise<BandNameGeneratorResponse> {
  if (input.mode === "template") {
    return generateTemplateIdeas(input);
  }

  const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";
  const { modelName, temperature } = resolveBandModelConfig(input.modelMode);
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GRSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelName,
      stream: false,
      temperature,
      messages: [
        {
          role: "user",
          content: buildBandNamePrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`upstream responded with status ${response.status}`);
  }

  const json = await response.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";

  return parseBandNameResponse(content);
}

// ---------------------------------------------------------------------------
// No-AI mode: deterministic word-list combinations. No model call happens on
// this path — the pattern note the UI shows is derived from the template that
// actually produced the name, so the mode is described truthfully.
// ---------------------------------------------------------------------------

interface GenreBank {
  adjectives: string[];
  nouns: string[];
  suffixes: string[];
}

const WORD_BANKS: Record<BandGenre, GenreBank> = {
  rock: {
    adjectives: [
      "Wild",
      "Broken",
      "Silver",
      "Electric",
      "Midnight",
      "Reckless",
      "Golden",
      "Restless",
      "Crimson",
      "Hollow",
      "Raging",
      "Southern",
    ],
    nouns: [
      "Highway",
      "Rose",
      "Radio",
      "Thunder",
      "Ember",
      "Stone",
      "River",
      "Lightning",
      "Whiskey",
      "Wolf",
      "Static",
      "Heart",
    ],
    suffixes: [
      "Kings",
      "Machine",
      "Riot",
      "Society",
      "Saints",
      "Division",
      "Sons",
      "Circus",
    ],
  },
  metal: {
    adjectives: [
      "Iron",
      "Black",
      "Burnt",
      "Eternal",
      "Frozen",
      "Obsidian",
      "Screaming",
      "Ashen",
      "Wretched",
      "Molten",
      "Thorned",
      "Sunless",
    ],
    nouns: [
      "Oath",
      "Tomb",
      "Serpent",
      "Fortress",
      "Crown",
      "Anvil",
      "Requiem",
      "Abyss",
      "Temple",
      "Storm",
      "Colossus",
      "Vigil",
    ],
    suffixes: [
      "Throne",
      "Covenant",
      "Dawn",
      "Void",
      "Reign",
      "Legion",
      "Altar",
      "Eclipse",
    ],
  },
  indie: {
    adjectives: [
      "Faint",
      "Paper",
      "Lazy",
      "Quiet",
      "Violet",
      "Borrowed",
      "Crooked",
      "Sleepy",
      "Tender",
      "Wandering",
      "Modest",
      "Late",
    ],
    nouns: [
      "Coastline",
      "Bedroom",
      "Cassette",
      "Bicycle",
      "Film",
      "Garden",
      "Postcard",
      "Sweater",
      "Attic",
      "Station",
      "Cloud",
      "Mural",
    ],
    suffixes: [
      "Club",
      "Collective",
      "Parade",
      "Picnic",
      "Session",
      "Society",
      "Tape",
      "Weekend",
    ],
  },
  emo: {
    adjectives: [
      "Bruised",
      "Fragile",
      "Homesick",
      "Sleepless",
      "Bittersweet",
      "Fading",
      "Anxious",
      "Winter",
      "Undone",
      "Aching",
      "Neon",
      "Worried",
    ],
    nouns: [
      "Diary",
      "Basement",
      "Skyline",
      "Letter",
      "October",
      "Sidewalk",
      "Promise",
      "Motel",
      "Bookmark",
      "Halo",
      "Souvenir",
      "Raincheck",
    ],
    suffixes: [
      "Confessions",
      "Yearbook",
      "Anthem",
      "Exit",
      "Encore",
      "Theory",
      "Season",
      "Longing",
    ],
  },
  pop: {
    adjectives: [
      "Golden",
      "Sugar",
      "Bright",
      "Cosmic",
      "Plastic",
      "Sunny",
      "Cherry",
      "Lucky",
      "Diamond",
      "Fizzy",
      "Peachy",
      "Magnetic",
    ],
    nouns: [
      "Heartbeat",
      "Confetti",
      "Starlight",
      "Summer",
      "Melody",
      "Dancefloor",
      "Firework",
      "Sunday",
      "Bubble",
      "Chorus",
      "Cinema",
      "Galaxy",
    ],
    suffixes: [
      "Club",
      "Kids",
      "Party",
      "Dream",
      "Fever",
      "Anthem",
      "Hour",
      "Parade",
    ],
  },
  electronic: {
    adjectives: [
      "Neon",
      "Digital",
      "Chrome",
      "Synthetic",
      "Wireless",
      "Ultraviolet",
      "Parallel",
      "Liquid",
      "Strobe",
      "Binary",
      "Glacial",
      "Pixel",
    ],
    nouns: [
      "Circuit",
      "Pulse",
      "Signal",
      "Prism",
      "Frequency",
      "Mirage",
      "Voltage",
      "Data",
      "Horizon",
      "Echo",
      "Grid",
      "Array",
    ],
    suffixes: [
      "Youth",
      "Lab",
      "Theory",
      "System",
      "Project",
      "Collective",
      "Unit",
      "Sequence",
    ],
  },
  hip_hop: {
    adjectives: [
      "Gold",
      "Raw",
      "Uptown",
      "Midnight",
      "Heavy",
      "Concrete",
      "Velvet",
      "Ruthless",
      "Silk",
      "Brass",
      "Frost",
      "Grand",
    ],
    nouns: [
      "Cipher",
      "Boombox",
      "Borough",
      "Corner",
      "Cadillac",
      "Vinyl",
      "Block",
      "Sermon",
      "Avenue",
      "Dice",
      "Skylark",
      "Loft",
    ],
    suffixes: [
      "Crew",
      "Syndicate",
      "Movement",
      "Collective",
      "Committee",
      "Union",
      "Dynasty",
      "Bandits",
    ],
  },
};

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function titleCaseWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Extract up to three usable anchor words from the cue / inspiration string.
 * Only letters, digits, spaces, and hyphens survive; each word is capped in
 * length so a pasted sentence cannot blow up the generated name.
 */
function anchorWords(raw: string): string[] {
  return raw
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && word.length <= 14)
    .slice(0, 3)
    .map(titleCaseWord);
}

interface TemplateResult {
  name: string;
  pattern: BandTemplateIdea["pattern"];
  parts: string[];
}

function buildCandidate(
  bank: GenreBank,
  length: BandNameLength,
  anchor: string[]
): TemplateResult {
  // Weighted pattern choice by requested length.
  let patterns: BandTemplateIdea["pattern"][];
  switch (length) {
    case "one_word":
      patterns = ["compound_word"];
      break;
    case "short":
      patterns = ["adj_noun", "noun_suffix", "cue_suffix"];
      break;
    case "phrase":
      patterns = ["the_adj_noun", "noun_and_the_plural", "cue_suffix"];
      break;
    default:
      patterns = [
        "the_adj_noun",
        "adj_noun",
        "noun_suffix",
        "compound_word",
        "noun_and_the_plural",
        "cue_suffix",
      ];
  }

  const pattern = pick(patterns);
  const adj = pick(bank.adjectives);
  const noun = pick(bank.nouns);
  const suffix = pick(bank.suffixes);

  switch (pattern) {
    case "the_adj_noun":
      return { name: `The ${adj} ${noun}`, pattern, parts: ["The", adj, noun] };
    case "adj_noun":
      return { name: `${adj} ${noun}`, pattern, parts: [adj, noun] };
    case "noun_suffix":
      return { name: `${noun} ${suffix}`, pattern, parts: [noun, suffix] };
    case "compound_word":
      return {
        name: `${adj}${noun}`,
        pattern,
        parts: [adj, noun],
      };
    case "noun_and_the_plural":
      return {
        name: `${noun} & the ${suffix}`,
        pattern,
        parts: [noun, "the", suffix],
      };
    case "cue_suffix": {
      const cueWord = anchor.length > 0 ? anchor[Math.floor(Math.random() * anchor.length)] : noun;
      const useSuffix = Math.random() < 0.5;
      if (useSuffix) {
        return { name: `${cueWord} ${suffix}`, pattern, parts: [cueWord, suffix] };
      }
      const partner = pick(bank.nouns);
      return {
        name: `${cueWord} ${partner}`,
        pattern,
        parts: [cueWord, partner],
      };
    }
  }
}

export function generateTemplateIdeas(
  input: NormalizedBandNameRequest
): Extract<BandNameGeneratorResponse, { mode: "template" }> {
  const bank = WORD_BANKS[input.genre];
  // Template mode is English word combinations by design; the cue (or the
  // "more like this" inspiration) is honored as the anchor word.
  const anchor = anchorWords(input.cue || input.inspirationName);

  const seen = new Set<string>();
  const ideas: BandTemplateIdea[] = [];
  let attempts = 0;

  while (ideas.length < TEMPLATE_IDEA_COUNT && attempts < 200) {
    attempts += 1;
    const candidate = buildCandidate(bank, input.length, anchor);
    if (seen.has(candidate.name)) continue;
    seen.add(candidate.name);
    ideas.push(candidate);
  }

  while (ideas.length < TEMPLATE_IDEA_COUNT) {
    // Extremely unlikely fallback once the pattern space is exhausted.
    const filler = `Static No.${ideas.length + 1}`;
    if (!seen.has(filler)) {
      seen.add(filler);
      ideas.push({ name: filler, pattern: "noun_suffix", parts: ["Static", `No.${ideas.length + 1}`] });
    }
  }

  return {
    mode: "template",
    ideas: ideas as unknown as Extract<
      BandNameGeneratorResponse,
      { mode: "template" }
    >["ideas"],
  };
}
