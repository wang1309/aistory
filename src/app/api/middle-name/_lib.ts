import type {
  MiddleNameCadence,
  MiddleNameDirection,
  MiddleNameEra,
  MiddleNameGeneratorResponse,
  MiddleNameModelMode,
  MiddleNameOutputLocale,
  MiddleNameSetting,
  MiddleNameTone,
  MiddleNameUseCase,
  NormalizedMiddleNameRequest,
} from "@/types/middle-name-generator";

const USE_CASES = ["fictional_character", "pen_name"] as const;
const MODES = ["fast", "standard", "creative"] as const;
const SETTINGS = [
  "contemporary",
  "mystery_thriller",
  "romance",
  "fantasy",
  "historical",
  "science_fiction",
  "literary",
] as const;
const ERAS = [
  "any",
  "contemporary",
  "mid_20th",
  "early_20th",
  "victorian",
  "timeless",
] as const;
const TONES = [
  "restrained",
  "formal",
  "old_money",
  "rebellious",
  "inherited",
  "warm",
  "mysterious",
] as const;
const CADENCES = ["any", "short", "long"] as const;
const OUTPUT_LOCALES = ["en", "zh", "de", "ko", "ja", "ru"] as const;

const MAX_NAME = 60;
const MAX_AVOID_INITIALS = 12;
const MAX_NOTE = 160;

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

/**
 * Normalize a supplied name part: collapse whitespace, drop characters that
 * have no place in a name, and cap length. Names are never logged.
 */
function normalizeNamePart(value: unknown): string {
  return clean(value)
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{M}'’.-]/gu, "")
    .replace(/^[.'-]+|[.'-]+$/g, "")
    .slice(0, MAX_NAME);
}

/**
 * Reduce the free-form "initials to avoid" field to a deduplicated uppercase
 * letter set, e.g. "A, s s" -> "A S". Shared verbatim with the prompt so the
 * model and the client-side warning check agree.
 */
export function normalizeAvoidInitials(value: unknown): string {
  const letters = clean(value)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return Array.from(new Set(letters.split(""))).slice(0, 24).join(" ");
}

export function validateMiddleNameRequest(input: {
  useCase?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  setting?: unknown;
  era?: unknown;
  tone?: unknown;
  cadence?: unknown;
  avoidInitials?: unknown;
  note?: unknown;
  locale?: unknown;
  mode?: unknown;
}): { ok: true; value: NormalizedMiddleNameRequest } | { ok: false; message: string } {
  const useCase = resolveControl(input.useCase, USE_CASES, "fictional_character");
  if (!useCase) return { ok: false, message: "Unsupported use case." };

  const setting = resolveControl(input.setting, SETTINGS, "contemporary");
  if (!setting) return { ok: false, message: "Unsupported setting." };

  const era = resolveControl(input.era, ERAS, "any");
  if (!era) return { ok: false, message: "Unsupported era." };

  const tone = resolveControl(input.tone, TONES, "restrained");
  if (!tone) return { ok: false, message: "Unsupported tone." };

  const cadence = resolveControl(input.cadence, CADENCES, "any");
  if (!cadence) return { ok: false, message: "Unsupported cadence." };

  const locale = resolveControl(input.locale, OUTPUT_LOCALES, "en");
  if (!locale) return { ok: false, message: "Unsupported locale." };

  const mode = resolveControl(input.mode, MODES, "standard");
  if (!mode) return { ok: false, message: "Unsupported model mode." };

  const firstName = normalizeNamePart(input.firstName);
  const lastName = normalizeNamePart(input.lastName);

  if (clean(input.avoidInitials).length > MAX_AVOID_INITIALS) {
    return {
      ok: false,
      message: `Initials to avoid must be ${MAX_AVOID_INITIALS} characters or fewer.`,
    };
  }
  const avoidInitials = normalizeAvoidInitials(input.avoidInitials);

  const note = clean(input.note).slice(0, MAX_NOTE);

  return {
    ok: true,
    value: {
      useCase,
      firstName,
      lastName,
      setting,
      era,
      tone,
      cadence,
      avoidInitials,
      note,
      locale,
      mode,
    },
  };
}

/** Same model ladder as the pen-name generator: fast / standard / creative. */
export function resolveMiddleNameModel(mode: MiddleNameModelMode): {
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

function purposeLine(useCase: MiddleNameUseCase): string {
  switch (useCase) {
    case "fictional_character":
      return "Use case 'fictional_character': the middle name completes a fictional character's full name. Each direction should carry a story or family signal the writer can use (role, class, family history, hidden inheritance).";
    case "pen_name":
      return "Use case 'pen_name': the middle name completes an author byline. Each direction should explain what the middle adds to the byline's memorability and genre fit.";
  }
}

function settingLine(setting: MiddleNameSetting): string {
  switch (setting) {
    case "contemporary":
      return "Setting 'contemporary': present-day stories; names should read as believable in a modern cast without chasing trends.";
    case "mystery_thriller":
      return "Setting 'mystery_thriller': the name should fit a mystery or thriller cast — controlled, readable, with quiet tension under the surface.";
    case "romance":
      return "Setting 'romance': the name should suit a romance lead — warm, sayable, easy to root for.";
    case "fantasy":
      return "Setting 'fantasy': the name should fit a fantasy world — evocative but still consistent as a full name a reader can track.";
    case "historical":
      return "Setting 'historical': the name should fit a historical novel's period register; do not invent origin claims, just match the sound of the era's naming styles.";
    case "science_fiction":
      return "Setting 'science_fiction': the name should fit a science-fiction cast — crisp and forward-leaning while staying human.";
    case "literary":
      return "Setting 'literary': the name should suit literary fiction — understated, precise, at home in close third person.";
  }
}

function eraLine(era: MiddleNameEra): string {
  switch (era) {
    case "any":
      return "Era: no specific era — keep the name era-flexible.";
    case "contemporary":
      return "Era 'contemporary': the name should sound at home in a story set roughly in the 2020s.";
    case "mid_20th":
      return "Era 'mid_20th': the name should sound plausible for someone born mid-20th century.";
    case "early_20th":
      return "Era 'early_20th': the name should sound plausible for someone born in the early 20th century.";
    case "victorian":
      return "Era 'victorian': the name should carry a 19th-century register without turning into parody.";
    case "timeless":
      return "Era 'timeless': prefer names that do not pin the character to one decade.";
  }
}

function toneLine(tone: MiddleNameTone): string {
  switch (tone) {
    case "restrained":
      return "Tone 'restrained': quiet, controlled, nothing melodramatic.";
    case "formal":
      return "Tone 'formal': the full name should read as formal, the kind used in full at ceremonies or in official scenes.";
    case "old_money":
      return "Tone 'old_money': understated wealth and lineage — no flashy spellings.";
    case "rebellious":
      return "Tone 'rebellious': a name with an edge, as if chosen or earned against the family's grain.";
    case "inherited":
      return "Tone 'inherited': the middle name should feel handed down through the family, like a name reused across generations.";
    case "warm":
      return "Tone 'warm': gentle and human, the name a grandmother would use.";
    case "mysterious":
      return "Tone 'mysterious': a name that withholds as much as it reveals.";
  }
}

function cadenceLine(cadence: MiddleNameCadence): string {
  switch (cadence) {
    case "any":
      return "Cadence: no constraint — vary the length across the three directions.";
    case "short":
      return "Cadence 'short': prefer short middle names (one or two syllables) so the surname keeps its weight.";
    case "long":
      return "Cadence 'long': prefer longer middle names (three or more syllables) that give the full name a formal stride.";
  }
}

export function buildMiddleNamePrompt(input: NormalizedMiddleNameRequest): string {
  const language = OUTPUT_LANGUAGES[input.locale];
  const hasFrame = Boolean(input.firstName || input.lastName);

  return [
    "You are a naming consultant for fiction writers and authors. Produce exactly 3 distinct middle-name directions.",
    "Return valid JSON only. JSON only, no prose before or after.",
    purposeLine(input.useCase),
    settingLine(input.setting),
    eraLine(input.era),
    toneLine(input.tone),
    cadenceLine(input.cadence),
    input.firstName
      ? `First name (must be kept exactly as written): ${input.firstName}`
      : "First name: not supplied — invent a compatible first name for the fullName frame.",
    input.lastName
      ? `Last name (must be kept exactly as written): ${input.lastName}`
      : "Last name: not supplied — invent a compatible last name for the fullName frame.",
    "Each direction must take a genuinely different cadence or story angle; never three variations of the same name.",
    input.avoidInitials
      ? `Constraint: the initials of the complete name must avoid the letters ${input.avoidInitials.split(" ").join(", ")}.`
      : "Constraint: no initials to avoid.",
    input.note ? `Note from the writer: ${input.note}` : "Note from the writer: not provided.",
    `Write the cadenceNote and implication values in ${language}. Keep the middleName and fullName in Latin script suited to the setting.`,
    "The cadenceNote is one short, hedged sentence about how the full name sounds when spoken (e.g. 'a short middle gives the surname more weight'). Never present it as an objective score.",
    "The implication is one sentence on what the middle name signals in the story (role, family history, class) or in a byline, depending on the use case.",
    "Every middle name must be an original suggestion. Never use or imitate the name of a real public figure, living person, or copyrighted character.",
    "Never state or imply anything about a name's etymology, popularity, cultural origin, uniqueness, trademark, domain, or legal availability.",
    "Never make or imply claims about the gender, ethnicity, nationality, religion, or cultural identity behind a name.",
    "Each direction requires the fields: middleName, fullName (first + middle + last, in that order), cadenceNote, implication, and tags (1 to 3 short labels).",
    'Output shape: {"directions":[{"middleName":"","fullName":"","cadenceNote":"","implication":"","tags":[""]}]}',
  ].join("\n");
}

function unwrapFenced(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? raw.trim();
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Rebuild the full name deterministically from the supplied parts so the
 * user's own naming decisions can never be overwritten by the model.
 */
function assembleFullName(
  firstName: string,
  middleName: string,
  lastName: string,
  aiFullName: string
): string {
  if (!firstName && !lastName) return aiFullName;
  const parts: string[] = [];
  if (firstName) parts.push(firstName);
  parts.push(middleName);
  if (lastName) parts.push(lastName);
  return parts.join(" ");
}

export function parseMiddleNameResponse(
  raw: string,
  firstName: string,
  lastName: string
): MiddleNameGeneratorResponse {
  const jsonText = unwrapFenced(raw);
  const parsed = JSON.parse(jsonText) as { directions?: unknown };

  const list = Array.isArray(parsed.directions) ? parsed.directions : [];
  const directions = list
    .map((item): MiddleNameDirection | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (
        !isNonEmpty(obj.middleName) ||
        !isNonEmpty(obj.cadenceNote) ||
        !isNonEmpty(obj.implication)
      ) {
        return null;
      }
      const tagList = Array.isArray(obj.tags) ? obj.tags : [];
      const tags = tagList
        .filter((tag): tag is string => isNonEmpty(tag))
        .map((tag) => tag.trim());
      if (tags.length < 1 || tags.length > 3) return null;
      const middleName = obj.middleName.trim();
      return {
        middleName,
        fullName: assembleFullName(
          firstName,
          middleName,
          lastName,
          isNonEmpty(obj.fullName) ? obj.fullName.trim() : ""
        ),
        cadenceNote: obj.cadenceNote.trim(),
        implication: obj.implication.trim(),
        tags,
      };
    })
    .filter((item): item is MiddleNameDirection => item !== null);

  if (directions.length !== 3) {
    throw new Error("Expected three complete directions");
  }

  const uniqueMiddles = new Set(
    directions.map((item) => item.middleName.toLowerCase())
  );
  if (uniqueMiddles.size !== 3) {
    throw new Error("Expected three distinct middle names");
  }

  return {
    directions: directions as unknown as MiddleNameGeneratorResponse["directions"],
  };
}

export async function generateMiddleNames(
  input: NormalizedMiddleNameRequest
): Promise<MiddleNameGeneratorResponse> {
  const { modelName, temperature } = resolveMiddleNameModel(input.mode);
  const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";
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
          content: buildMiddleNamePrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`upstream responded with status ${response.status}`);
  }

  const json = await response.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";

  return parseMiddleNameResponse(content, input.firstName, input.lastName);
}
