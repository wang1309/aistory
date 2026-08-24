import type {
  ElfHeritage,
  ElfNameForm,
  ElfNameLocale,
  ElfNameModelMode,
  ElfNameStyle,
  ElfNameUse,
  ElfNameGeneratorResponse,
  ElfNameCandidate,
  NormalizedElfNameRequest,
} from "@/types/elf-name-generator";

const HERITAGES = [
  "moonlit_court",
  "ancient_woodland",
  "shadowborne",
  "sunlit_scholar",
  "custom",
] as const;
const STYLES = [
  "graceful",
  "ancient",
  "fierce",
  "mysterious",
  "playful",
] as const;
const NAME_USES = ["character", "family_clan", "npc_set"] as const;
const NAME_FORMS = ["feminine", "masculine", "neutral", "mixed"] as const;
const LOCALES = ["en", "zh", "de", "ko", "ja", "ru"] as const;
const MODES = ["fast", "standard", "creative"] as const;

const MAX_ROLE_BACKGROUND = 400;
const MAX_CUSTOM_HERITAGE = 160;
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

export function validateElfNameRequest(input: {
  heritage?: unknown;
  style?: unknown;
  nameUse?: unknown;
  nameForm?: unknown;
  roleBackground?: unknown;
  customHeritage?: unknown;
  inspirationName?: unknown;
  locale?: unknown;
  mode?: unknown;
}): { ok: true; value: NormalizedElfNameRequest } | { ok: false; message: string } {
  const heritage = resolveControl(input.heritage, HERITAGES, "moonlit_court");
  if (!heritage) return { ok: false, message: "Unsupported heritage." };

  const style = resolveControl(input.style, STYLES, "graceful");
  if (!style) return { ok: false, message: "Unsupported style." };

  const nameUse = resolveControl(input.nameUse, NAME_USES, "character");
  if (!nameUse) return { ok: false, message: "Unsupported name use." };

  const nameForm = resolveControl(input.nameForm, NAME_FORMS, "neutral");
  if (!nameForm) return { ok: false, message: "Unsupported name form." };

  const locale = resolveControl(input.locale, LOCALES, "en");
  if (!locale) return { ok: false, message: "Unsupported locale." };

  const mode = resolveControl(input.mode, MODES, "standard");
  if (!mode) return { ok: false, message: "Unsupported model mode." };

  const roleBackground = clean(input.roleBackground);
  if (roleBackground.length > MAX_ROLE_BACKGROUND) {
    return {
      ok: false,
      message: `Role background must be ${MAX_ROLE_BACKGROUND} characters or fewer.`,
    };
  }

  const customHeritage = clean(input.customHeritage);
  if (heritage === "custom" && !customHeritage) {
    return { ok: false, message: "Custom heritage is required." };
  }
  if (customHeritage.length > MAX_CUSTOM_HERITAGE) {
    return {
      ok: false,
      message: `Custom heritage must be ${MAX_CUSTOM_HERITAGE} characters or fewer.`,
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
      heritage,
      style,
      nameUse,
      nameForm,
      roleBackground,
      customHeritage,
      inspirationName,
      locale,
      mode,
    },
  };
}

function heritageLine(input: NormalizedElfNameRequest): string {
  if (input.heritage === "custom") {
    return `Heritage: a fully original elf culture described as "${input.customHeritage}". Invent naming conventions that fit this culture.`;
  }
  switch (input.heritage) {
    case "moonlit_court":
      return "Heritage 'moonlit_court': an elegant, ceremonial elf court tied to moonlight, ritual, and refinement.";
    case "ancient_woodland":
      return "Heritage 'ancient_woodland': a reclusive forest people with deep roots, moss, oak, and old magic.";
    case "shadowborne":
      return "Heritage 'shadowborne': a dusk-bound lineage comfortable with stealth, twilight, and veiled cities.";
    case "sunlit_scholar":
      return "Heritage 'sunlit_scholar': an open, learned society of archives, dawn rituals, and bright towers.";
  }
}

function styleLine(style: ElfNameStyle): string {
  switch (style) {
    case "graceful":
      return "Style 'graceful': flowing, melodic, gently rolling syllables.";
    case "ancient":
      return "Style 'ancient': weighty, time-worn syllables that feel old and storied.";
    case "fierce":
      return "Style 'fierce': sharp, strong, consonant-forward syllables with impact.";
    case "mysterious":
      return "Style 'mysterious': hushed, elusive syllables with an air of secrecy.";
    case "playful":
      return "Style 'playful': light, bouncy, easily spoken syllables with warmth.";
  }
}

function nameUseLine(nameUse: ElfNameUse): string {
  switch (nameUse) {
    case "character":
      return "Name use 'character': one name for a single named character.";
    case "family_clan":
      return "Name use 'family_clan': a shared family or clan name; the ten candidates may read as related name-shapes for one lineage.";
    case "npc_set":
      return "Name use 'npc_set': a usable set of distinct names for a group of NPCs; keep them varied so they do not blur together.";
  }
}

function nameFormLine(nameForm: ElfNameForm): string {
  switch (nameForm) {
    case "feminine":
      return "Name form 'feminine': feminine-leaning names.";
    case "masculine":
      return "Name form 'masculine': masculine-leaning names.";
    case "neutral":
      return "Name form 'neutral': gender-neutral names.";
    case "mixed":
      return "Name form 'mixed': a balanced mix of feminine, masculine, and neutral names.";
  }
}

export function buildElfNamePrompt(
  input: NormalizedElfNameRequest
): string {
  const language = OUTPUT_LANGUAGES[input.locale];

  return [
    "You are an original fantasy name generator. Produce exactly 10 distinct elf name candidates.",
    "Return valid JSON only. JSON only, no prose before or after.",
    heritageLine(input),
    styleLine(input.style),
    nameUseLine(input.nameUse),
    nameFormLine(input.nameForm),
    `Role or story context: ${input.roleBackground || "not provided"}`,
    input.inspirationName
      ? `Inspiration: create names that share the sound and feel of "${input.inspirationName}" without copying or slightly editing it.`
      : "Inspiration: not provided.",
    `Write all pronunciation, meaning, reason, and tag values in ${language}. The 'name' field itself stays a romanized fantasy name regardless of locale.`,
    "Every name must be a fully original invented fantasy name. Do not imitate, reference, or echo names from any recognizable franchise, author, or constructed fantasy language.",
    "These names are creative inventions: they are not words of any official language, and you must never claim or imply they are official translations or verified linguistic meanings. Meanings are creative interpretations invented for the user's world.",
    "Each candidate requires the fields: name, pronunciation (a simple syllable guide), meaning (a short creative interpretation), reason (why it fits the heritage/style/context), and tags (1 to 3 short labels).",
    'Output shape: {"candidates":[{"name":"","pronunciation":"","meaning":"","reason":"","tags":[""]}]}',
  ].join("\n");
}

function unwrapFenced(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? raw.trim();
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseElfNameResponse(
  raw: string
): ElfNameGeneratorResponse {
  const jsonText = unwrapFenced(raw);
  const parsed = JSON.parse(jsonText) as { candidates?: unknown };

  const list = Array.isArray(parsed.candidates) ? parsed.candidates : [];
  const candidates = list
    .map((item): ElfNameCandidate | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (
        !isNonEmpty(obj.name) ||
        !isNonEmpty(obj.pronunciation) ||
        !isNonEmpty(obj.meaning) ||
        !isNonEmpty(obj.reason)
      ) {
        return null;
      }
      const tagList = Array.isArray(obj.tags) ? obj.tags : [];
      const tags = tagList
        .filter((tag): tag is string => isNonEmpty(tag))
        .map((tag) => tag.trim());
      if (tags.length < 1 || tags.length > 3) return null;
      return {
        name: obj.name.trim(),
        pronunciation: obj.pronunciation.trim(),
        meaning: obj.meaning.trim(),
        reason: obj.reason.trim(),
        tags,
      };
    })
    .filter((item): item is ElfNameCandidate => item !== null);

  if (candidates.length !== 10) {
    throw new Error("Expected ten complete candidates");
  }

  return {
    candidates: candidates as unknown as ElfNameGeneratorResponse["candidates"],
  };
}

export function resolveElfNameModelConfig(mode: ElfNameModelMode): {
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

export async function generateElfNames(
  input: NormalizedElfNameRequest
): Promise<ElfNameGeneratorResponse> {
  const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";
  const { modelName, temperature } = resolveElfNameModelConfig(input.mode);
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
          content: buildElfNamePrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`upstream responded with status ${response.status}`);
  }

  const json = await response.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";

  return parseElfNameResponse(content);
}
