import type {
  PenNameBrandGoal,
  PenNameCandidate,
  PenNameForm,
  PenNameGenre,
  PenNameGeneratorResponse,
  PenNameMarket,
  PenNameModelMode,
  PenNameTone,
  NormalizedPenNameRequest,
} from "@/types/pen-name-generator";

const GENRES = [
  "romance",
  "thriller_mystery",
  "fantasy",
  "science_fiction",
  "literary",
  "non_fiction",
  "general",
] as const;
const BRAND_GOALS = [
  "single_brand",
  "separate_genres",
  "privacy_first",
  "initials_led",
] as const;
const TONES = [
  "classic",
  "warm",
  "bold",
  "mysterious",
  "modern",
  "scholarly",
] as const;
const NAME_FORMS = [
  "full_name",
  "first_initial",
  "initials_surname",
  "single_name",
] as const;
const MARKETS = ["en", "zh", "de", "ko", "ja", "ru"] as const;
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

export function validatePenNameRequest(input: {
  genre?: unknown;
  brandGoal?: unknown;
  tone?: unknown;
  nameForm?: unknown;
  targetMarket?: unknown;
  cue?: unknown;
  inspirationName?: unknown;
  locale?: unknown;
  mode?: unknown;
}): { ok: true; value: NormalizedPenNameRequest } | { ok: false; message: string } {
  const genre = resolveControl(input.genre, GENRES, "general");
  if (!genre) return { ok: false, message: "Unsupported genre." };

  const brandGoal = resolveControl(input.brandGoal, BRAND_GOALS, "single_brand");
  if (!brandGoal) return { ok: false, message: "Unsupported brand goal." };

  const tone = resolveControl(input.tone, TONES, "classic");
  if (!tone) return { ok: false, message: "Unsupported tone." };

  const nameForm = resolveControl(input.nameForm, NAME_FORMS, "full_name");
  if (!nameForm) return { ok: false, message: "Unsupported name form." };

  const targetMarket = resolveControl(input.targetMarket, MARKETS, "en");
  if (!targetMarket) return { ok: false, message: "Unsupported target market." };

  const locale = resolveControl(input.locale, MARKETS, "en");
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
      genre,
      brandGoal,
      tone,
      nameForm,
      targetMarket,
      cue,
      inspirationName,
      locale,
      mode,
    },
  };
}

function genreLine(genre: PenNameGenre): string {
  switch (genre) {
    case "romance":
      return "Genre 'romance': names should suit romance fiction bylines — warm, memorable, easy to say at signings and in reader communities.";
    case "thriller_mystery":
      return "Genre 'thriller_mystery': names should suit thriller and mystery bylines — restrained, confident, slightly suspenseful.";
    case "fantasy":
      return "Genre 'fantasy': names should suit fantasy bylines — evocative and imaginative while still plausible as an author credit.";
    case "science_fiction":
      return "Genre 'science_fiction': names should suit science fiction bylines — crisp, forward-leaning, credible on a hard-SF spine.";
    case "literary":
      return "Genre 'literary': names should suit literary fiction bylines — understated, elegant, at home on a prize longlist.";
    case "non_fiction":
      return "Genre 'non_fiction': names should suit non-fiction bylines — professional and authoritative for essays, history, and advice.";
    case "general":
      return "Genre 'general': names should work across genres as a versatile all-purpose author byline.";
  }
}

function brandGoalLine(brandGoal: PenNameBrandGoal): string {
  switch (brandGoal) {
    case "single_brand":
      return "Brand goal 'single_brand': one coherent byline the author can build a single recognizable brand around.";
    case "separate_genres":
      return "Brand goal 'separate_genres': names that could stand apart from the author's other work, so different genres read as different writers.";
    case "privacy_first":
      return "Brand goal 'privacy_first': names chosen to keep distance between the byline and the author's everyday identity, while staying pronounceable.";
    case "initials_led":
      return "Brand goal 'initials_led': names led by initials (or an initial-plus-surname shape) in the tradition of initials-style bylines.";
  }
}

function toneLine(tone: PenNameTone): string {
  switch (tone) {
    case "classic":
      return "Tone 'classic': timeless, traditional publishing-house feel.";
    case "warm":
      return "Tone 'warm': approachable and friendly.";
    case "bold":
      return "Tone 'bold': punchy and attention-grabbing.";
    case "mysterious":
      return "Tone 'mysterious': understated with an air of intrigue.";
    case "modern":
      return "Tone 'modern': contemporary and clean.";
    case "scholarly":
      return "Tone 'scholarly': serious and credentialed.";
  }
}

function nameFormLine(nameForm: PenNameForm): string {
  switch (nameForm) {
    case "full_name":
      return "Name form 'full_name': a complete first name plus surname.";
    case "first_initial":
      return "Name form 'first_initial': a first initial followed by a full middle name and surname (e.g. 'A. Robin Vale').";
    case "initials_surname":
      return "Name form 'initials_surname': initials followed by a surname (e.g. 'S. R. Vale').";
    case "single_name":
      return "Name form 'single_name': a single standalone name or mononym.";
  }
}

export function buildPenNamePrompt(input: NormalizedPenNameRequest): string {
  const language = OUTPUT_LANGUAGES[input.locale];

  return [
    "You are a pen name consultant for authors. Produce exactly 10 distinct pen name candidates.",
    "Return valid JSON only. JSON only, no prose before or after.",
    genreLine(input.genre),
    brandGoalLine(input.brandGoal),
    toneLine(input.tone),
    nameFormLine(input.nameForm),
    `Target market: ${input.targetMarket}. Use the market only to set spelling and readability expectations for the names; do not imply the author is from that market.`,
    `Cue from the author: ${input.cue || "not provided"}`,
    input.inspirationName
      ? `Inspiration: create names that share the sound and feel of "${input.inspirationName}" without copying or slightly editing it.`
      : "Inspiration: not provided.",
    `Write all pronunciation, reason, and tag values in ${language}. Keep each candidate 'name' shaped so readers of that language can read and say it.`,
    "Every pen name must be an original invented name. Never use or imitate the name of a real public figure, known author, or fictional character, and never construct a name that could pass as impersonation of a real person.",
    "These are creative suggestions only. You must not claim or imply anything about availability, registration, trademark, copyright, or privacy protection for any name.",
    "Never make or imply claims about the gender, ethnicity, nationality, religion, or cultural identity behind a name; judge names only as bylines.",
    "Each candidate requires the fields: name, pronunciation (a simple syllable guide), reason (why it fits the genre, brand goal, and tone), and tags (1 to 3 short labels).",
    'Output shape: {"candidates":[{"name":"","pronunciation":"","reason":"","tags":[""]}]}',
  ].join("\n");
}

function unwrapFenced(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? raw.trim();
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parsePenNameResponse(raw: string): PenNameGeneratorResponse {
  const jsonText = unwrapFenced(raw);
  const parsed = JSON.parse(jsonText) as { candidates?: unknown };

  const list = Array.isArray(parsed.candidates) ? parsed.candidates : [];
  const candidates = list
    .map((item): PenNameCandidate | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (
        !isNonEmpty(obj.name) ||
        !isNonEmpty(obj.pronunciation) ||
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
        reason: obj.reason.trim(),
        tags,
      };
    })
    .filter((item): item is PenNameCandidate => item !== null);

  if (candidates.length !== 10) {
    throw new Error("Expected ten complete candidates");
  }

  return {
    candidates: candidates as unknown as PenNameGeneratorResponse["candidates"],
  };
}

export function resolvePenNameModelConfig(mode: PenNameModelMode): {
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

export async function generatePenNames(
  input: NormalizedPenNameRequest
): Promise<PenNameGeneratorResponse> {
  const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";
  const { modelName, temperature } = resolvePenNameModelConfig(input.mode);
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
          content: buildPenNamePrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`upstream responded with status ${response.status}`);
  }

  const json = await response.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";

  return parsePenNameResponse(content);
}
