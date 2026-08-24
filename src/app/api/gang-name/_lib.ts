import type {
  GangFlavor,
  GangGroupType,
  GangNameGeneratorResponse,
  GangNameModelMode,
  GangProfile,
  GangTone,
  GangWorld,
  GangOutputLocale,
  NormalizedGangNameRequest,
} from "@/types/gang-name-generator";

const WORLDS = [
  "street_crime",
  "mafia",
  "fantasy",
  "cyberpunk",
  "post_apocalyptic",
  "biker",
  "game_world",
] as const;
const GROUP_TYPES = [
  "crew",
  "crime_family",
  "syndicate",
  "brotherhood",
  "clan",
  "biker_club",
] as const;
const TONES = [
  "menacing",
  "gritty",
  "cunning",
  "flashy",
  "funny",
  "honorable",
] as const;
const FLAVORS = [
  "none",
  "italian",
  "japanese",
  "chinese",
  "western",
  "nordic",
] as const;
const OUTPUT_LOCALES = ["en", "zh", "de", "ko", "ja", "ru"] as const;
const MODES = ["fast", "standard", "creative"] as const;

const MAX_CUE = 120;
const MAX_INSPIRATION_NAME = 100;

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

export function validateGangNameRequest(input: {
  world?: unknown;
  groupType?: unknown;
  tone?: unknown;
  flavor?: unknown;
  cue?: unknown;
  inspirationName?: unknown;
  locale?: unknown;
  mode?: unknown;
}): { ok: true; value: NormalizedGangNameRequest } | { ok: false; message: string } {
  const world = resolveControl(input.world, WORLDS, "street_crime");
  if (!world) return { ok: false, message: "Unsupported world." };

  const groupType = resolveControl(input.groupType, GROUP_TYPES, "crew");
  if (!groupType) return { ok: false, message: "Unsupported group type." };

  const tone = resolveControl(input.tone, TONES, "menacing");
  if (!tone) return { ok: false, message: "Unsupported tone." };

  const flavor = resolveControl(input.flavor, FLAVORS, "none");
  if (!flavor) return { ok: false, message: "Unsupported cultural flavor." };

  const locale = resolveControl(input.locale, OUTPUT_LOCALES, "en");
  if (!locale) return { ok: false, message: "Unsupported locale." };

  const mode = resolveControl(input.mode, MODES, "standard");
  if (!mode) return { ok: false, message: "Unsupported model mode." };

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
      world,
      groupType,
      tone,
      flavor,
      cue,
      inspirationName,
      locale,
      mode,
    },
  };
}

function worldLine(world: GangWorld): string {
  switch (world) {
    case "street_crime":
      return "World 'street_crime': modern crime-noir cities — street crews, docks, night markets, and neighborhoods with unwritten rules.";
    case "mafia":
      return "World 'mafia': classic mob-fiction territory — crime families, back-room deals, loyalty oaths, and old-money fronts.";
    case "fantasy":
      return "World 'fantasy': fantasy realms — thieves' guilds, mercenary companies, and factions that fit magic, ruins, and rival courts.";
    case "cyberpunk":
      return "World 'cyberpunk': neon megacities — netrunner crews, corpo warzones, black-market augment clinics, and rain-soaked districts.";
    case "post_apocalyptic":
      return "World 'post_apocalyptic': collapsed-world wastelands — scavenger convoys, fortified settlements, fuel warlords, and ruined highways.";
    case "biker":
      return "World 'biker': outlaw-biker fiction — desert highways, garage hideouts, rally towns, and chrome-and-leather brotherhoods.";
    case "game_world":
      return "World 'game_world': an open-world action-game vibe in pure fiction — heist crews, turf wars, and getaways, styled like a crime video game without referencing any real game.";
  }
}

function groupTypeLine(groupType: GangGroupType): string {
  switch (groupType) {
    case "crew":
      return "Group type 'crew': a tight street crew — small, mobile, built on loyalty between a handful of members.";
    case "crime_family":
      return "Group type 'crime_family': a crime family — dynastic, hierarchical, with an aging boss and heirs competing for favor.";
    case "syndicate":
      return "Group type 'syndicate': a sprawling syndicate — businesslike, layered, with legitimate fronts and a cold chain of command.";
    case "brotherhood":
      return "Group type 'brotherhood': a sworn brotherhood or order — ritual, initiation, and a code members die for.";
    case "clan":
      return "Group type 'clan': an old clan — bloodlines, ancestral grudges, and territory held for generations.";
    case "biker_club":
      return "Group type 'biker_club': an outlaw riding club — chapters, road names, and a clubhouse everyone knows.";
  }
}

function toneLine(tone: GangTone): string {
  switch (tone) {
    case "menacing":
      return "Tone 'menacing': the name should make strangers check the exit.";
    case "gritty":
      return "Tone 'gritty': worn, unglamorous, believable — the name locals actually use.";
    case "cunning":
      return "Tone 'cunning': clever and double-edged — the name sounds respectable until you know what's behind it.";
    case "flashy":
      return "Tone 'flashy': loud and bragging — a name the members would stencil on a wall or a jacket.";
    case "funny":
      return "Tone 'funny': darkly comedic or absurd — a name that gets a laugh and still fits the setting.";
    case "honorable":
      return "Tone 'honorable': proud and almost noble — a name members treat like a title.";
  }
}

function flavorLine(flavor: GangFlavor): string {
  switch (flavor) {
    case "none":
      return "Cultural flavor: none — keep naming conventions generic and setting-neutral.";
    case "italian":
      return "Cultural flavor 'italian': phonetics reminiscent of Italian-language crime-saga fiction, invented from scratch.";
    case "japanese":
      return "Cultural flavor 'japanese': phonetics reminiscent of Japanese-language yakuza-fiction naming, invented from scratch.";
    case "chinese":
      return "Cultural flavor 'chinese': phonetics reminiscent of Chinese-language jianghu and wuxia clan naming, invented from scratch.";
    case "western":
      return "Cultural flavor 'western': phonetics reminiscent of Old West outlaw gangs and frontier posses, invented from scratch.";
    case "nordic":
      return "Cultural flavor 'nordic': phonetics reminiscent of Norse saga bands and shield-brother companies, invented from scratch.";
  }
}

export function buildGangNamePrompt(input: NormalizedGangNameRequest): string {
  const language = OUTPUT_LANGUAGES[input.locale];

  return [
    "You are a worldbuilding consultant for fiction writers and game masters. Produce exactly 6 distinct fictional criminal-organization profiles for stories, tabletop campaigns, and games.",
    "Return valid JSON only. JSON only, no prose before or after.",
    worldLine(input.world),
    groupTypeLine(input.groupType),
    toneLine(input.tone),
    flavorLine(input.flavor),
    `Extra cue from the writer (optional): ${input.cue || "not provided"}`,
    input.inspirationName
      ? `Inspiration: create names that share the sound and feel of "${input.inspirationName}" without copying or slightly editing it.`
      : "Inspiration: not provided.",
    `Write the meaning, reputation, territory, symbol, coreValue, and rivalHook values in ${language}. Shape each 'name' so readers of that language can read and say it.`,
    "Every organization, name, symbol, and territory must be entirely fictional and invented for this response. This is creative worldbuilding output only.",
    "Never use, reference, adapt, or evoke the real name, symbol, colors, hand signs, motto, or structure of any real-world gang, criminal organization, extremist group, or hate group.",
    "Never name or hint at real people, living or historical. Never produce content that could read as recruitment, initiation, or real-world criminal instruction.",
    "Each profile requires the fields: name (the group's name), meaning (one sentence on why the name works and what it suggests), reputation (one sentence on how the world sees them), territory (2-6 words naming their base or turf), symbol (2-6 words describing their invented visual mark), coreValue (2-6 words for the bond or code they live by), and rivalHook (one sentence of conflict a writer can use immediately).",
    'Output shape: {"profiles":[{"name":"","meaning":"","reputation":"","territory":"","symbol":"","coreValue":"","rivalHook":""}]}',
  ].join("\n");
}

function unwrapFenced(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? raw.trim();
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseGangNameResponse(raw: string): GangNameGeneratorResponse {
  const jsonText = unwrapFenced(raw);
  const parsed = JSON.parse(jsonText) as { profiles?: unknown };

  const list = Array.isArray(parsed.profiles) ? parsed.profiles : [];
  const profiles = list
    .map((item): GangProfile | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (
        !isNonEmpty(obj.name) ||
        !isNonEmpty(obj.meaning) ||
        !isNonEmpty(obj.reputation) ||
        !isNonEmpty(obj.territory) ||
        !isNonEmpty(obj.symbol) ||
        !isNonEmpty(obj.coreValue) ||
        !isNonEmpty(obj.rivalHook)
      ) {
        return null;
      }
      return {
        name: obj.name.trim(),
        meaning: obj.meaning.trim(),
        reputation: obj.reputation.trim(),
        territory: obj.territory.trim(),
        symbol: obj.symbol.trim(),
        coreValue: obj.coreValue.trim(),
        rivalHook: obj.rivalHook.trim(),
      };
    })
    .filter((item): item is GangProfile => item !== null);

  if (profiles.length !== 6) {
    throw new Error("Expected six complete profiles");
  }

  return {
    profiles: profiles as unknown as GangNameGeneratorResponse["profiles"],
  };
}

export function resolveGangNameModelConfig(mode: GangNameModelMode): {
  modelName: string;
  temperature: number;
} {
  switch (mode) {
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

export async function generateGangNames(
  input: NormalizedGangNameRequest
): Promise<GangNameGeneratorResponse> {
  const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";
  const { modelName, temperature } = resolveGangNameModelConfig(input.mode);
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
          content: buildGangNamePrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`upstream responded with status ${response.status}`);
  }

  const json = await response.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";

  return parseGangNameResponse(content);
}
