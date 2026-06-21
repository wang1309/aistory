import type {
  GeneratedYoutubeName,
  NormalizedYoutubeNameRequest,
  YoutubeNameCategory,
  YoutubeNameLengthPreference,
  YoutubeNamePivotFlexibility,
  YoutubeNamePromptOptions,
  YoutubeNameStyle,
} from "@/types/youtube-name";

const STYLES: readonly YoutubeNameStyle[] = [
  "brandable",
  "searchable",
  "hybrid",
  "funny",
  "personal",
  "expert",
  "cinematic",
];

const LENGTHS: readonly YoutubeNameLengthPreference[] = [
  "short",
  "medium",
  "flexible",
];

const PIVOTS: readonly YoutubeNamePivotFlexibility[] = ["low", "medium", "high"];

const DEFAULTS = {
  locale: "en",
  outputLanguage: "en",
  style: "hybrid" as YoutubeNameStyle,
  lengthPreference: "short" as YoutubeNameLengthPreference,
  pivotFlexibility: "medium" as YoutubeNamePivotFlexibility,
};

const LENGTH_GUIDANCE: Record<YoutubeNameLengthPreference, string> = {
  short: "1 word, 4-7 letters when possible. Max 2 short words.",
  medium: "1-2 words, 6-12 letters total.",
  flexible: "1-3 words. Optimize for impact rather than length.",
};

const PIVOT_GUIDANCE: Record<YoutubeNamePivotFlexibility, string> = {
  low: "Tightly tied to the stated niche. Sharp and specific.",
  medium: "Mostly on-niche but with room to expand into adjacent topics.",
  high: "Broad enough that the creator can pivot to related topics later.",
};

const STYLE_GUIDANCE: Record<YoutubeNameStyle, string> = {
  brandable:
    "Invented or evocative word that does not literally describe the niche (e.g. 'Streamly', 'Vortx'). Memorable and ownable.",
  searchable:
    "Contains clear niche keywords a viewer might search (e.g. 'ChessPuzzlePro'). Easier to find via search.",
  hybrid:
    "Blends a brandable coined element with one keyword (e.g. 'Nova Crafts'). Balances recall and discoverability.",
  funny:
    "Playful, witty, or pun-based. Sticks in the head because it makes people smile.",
  personal:
    "Built around the creator's name or nickname. Works for personality-led channels.",
  expert:
    "Sounds authoritative and credible. Useful for educational or professional channels.",
  cinematic:
    "Evocative, atmospheric, mood-driven. Works for film, travel, or storytelling channels.",
};

const STYLE_TO_CATEGORY: Record<YoutubeNameStyle, YoutubeNameCategory> = {
  brandable: "brandable",
  searchable: "searchable",
  hybrid: "hybrid",
  funny: "brandable",
  personal: "brandable",
  expert: "searchable",
  cinematic: "hybrid",
};

function cleanText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizeAllowedOption<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

function normalizeKeywords(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0)
      .slice(0, 8);
  }

  if (typeof input === "string") {
    return input
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 8);
  }

  return [];
}

export function normalizeYoutubeNameRequest(
  input: {
    niche?: string;
    audience?: string;
    style?: YoutubeNameStyle;
    lengthPreference?: YoutubeNameLengthPreference;
    pivotFlexibility?: YoutubeNamePivotFlexibility;
    keywords?: unknown;
    creatorName?: string;
    outputLanguage?: string;
    locale?: string;
  }
): NormalizedYoutubeNameRequest {
  const niche = cleanText(input.niche);
  const audience = cleanText(input.audience);
  const creatorName = cleanText(input.creatorName);
  const locale = cleanText(input.locale) || DEFAULTS.locale;
  const outputLanguage =
    cleanText(input.outputLanguage) || DEFAULTS.outputLanguage;
  const style = normalizeAllowedOption(input.style, STYLES, DEFAULTS.style);
  const lengthPreference = normalizeAllowedOption(
    input.lengthPreference,
    LENGTHS,
    DEFAULTS.lengthPreference
  );
  const pivotFlexibility = normalizeAllowedOption(
    input.pivotFlexibility,
    PIVOTS,
    DEFAULTS.pivotFlexibility
  );
  const keywords = normalizeKeywords(input.keywords);

  return {
    niche,
    audience,
    style,
    lengthPreference,
    pivotFlexibility,
    keywords,
    creatorName,
    outputLanguage,
    locale,
  };
}

export function buildYoutubeNamePrompt(
  options: YoutubeNamePromptOptions
): string {
  const targetCount = 24;
  const lines: string[] = [
    "You are a YouTube channel naming strategist for first-time creators. Generate launch-ready channel names with structured decision support.",
    "",
    "## Channel Brief",
    `- Niche: ${options.niche.trim() || "General entertainment"}`,
    `- Audience: ${options.audience.trim() || "Broad YouTube audience"}`,
    `- Naming style: ${options.style} — ${STYLE_GUIDANCE[options.style]}`,
    `- Length preference: ${options.lengthPreference} — ${LENGTH_GUIDANCE[options.lengthPreference]}`,
    `- Pivot flexibility: ${options.pivotFlexibility} — ${PIVOT_GUIDANCE[options.pivotFlexibility]}`,
    options.creatorName.trim()
      ? `- Creator name to weave in: "${options.creatorName.trim()}"`
      : "- Creator name: not provided",
    options.keywords.length
      ? `- Keywords to lean into: ${options.keywords.map((k) => `"${k}"`).join(", ")}`
      : "- Keywords: none specified",
    "",
    "## Output Requirements",
    `1. Generate exactly ${targetCount} distinct channel names.`,
    "2. Distribute names across three groups so the user can compare angles:",
    "   - brandable: invented or evocative names that feel ownable",
    "   - searchable: names with clear niche keywords for discovery",
    "   - hybrid: blends a brandable element with one keyword",
    "3. Match the requested naming style as the dominant flavor, but still populate the other two groups with sensible alternatives.",
    "4. Prefer names that are pronounceable, spellable in one try, and free of hyphens, numbers, or awkward letter clusters.",
    "5. Suggested handles must be lowercase, 3-30 characters, using only letters, numbers, dots, and underscores, starting and ending with a letter or number. Each name should map to a primary handle that is the closest available-looking variant.",
    `6. All explanations, rationales, and warnings MUST be written in this output language: ${options.outputLanguage}`,
    "",
    "## Per-Name Detail",
    "For every candidate, provide:",
    "- name: the channel name (capitalize appropriately)",
    "- suggestedHandle: the @handle variant (lowercase, no spaces)",
    "- category: one of brandable | searchable | hybrid",
    "- oneLineRationale: one short sentence explaining why it fits the brief",
    "- bestFor: one short phrase describing who this name is strongest for",
    "- scores (1-10 integers):",
    "  - memorability: how sticky it is after one read",
    "  - pronounceability: how easy it is to say aloud",
    "  - uniqueness: how likely it is to stand out in the niche",
    "  - pivotFlexibility: how much room it leaves to expand topics later",
    "- handleValidation:",
    "  - formatValid: true if the suggestedHandle passes YouTube handle format rules",
    "  - warnings: array of plain-language risks (e.g. looks like another word, numbers look spammy). Empty array if none.",
    "  - fallbackHandles: 2 alternative handles that keep the name recognizable if the primary is taken",
    "",
    "## Final Recommendation",
    "After listing all candidates, recommend ONE name that best balances memorability, uniqueness, pivot flexibility, and fit with the brief. Provide a one-sentence reason.",
    "",
    "## Output Format (strict)",
    "Return ONLY a single valid JSON object. No markdown fences, no prose, no trailing commas. Schema:",
    "{",
    '  "names": [',
    "    {",
    '      "name": "",',
    '      "suggestedHandle": "",',
    '      "category": "brandable" | "searchable" | "hybrid",',
    '      "oneLineRationale": "",',
    '      "bestFor": "",',
    '      "scores": { "memorability": 0, "pronounceability": 0, "uniqueness": 0, "pivotFlexibility": 0 },',
    '      "handleValidation": { "formatValid": true, "warnings": [], "fallbackHandles": [] }',
    "    }",
    "  ],",
    '  "recommendedName": "",',
    '  "recommendedReason": ""',
    "}",
  ];

  return lines.join("\n");
}

export function resolveYoutubeNameModelConfig(): {
  modelName: string;
  temperature: number;
} {
  return {
    modelName: "gemini-3.1-flash-lite",
    temperature: 0.85,
  };
}

const HANDLE_RULE = /^[a-zA-Z0-9][a-zA-Z0-9._]{1,28}[a-zA-Z0-9]$/;
const EXCESS_NUMBERS = /\d.*\d.*\d/;
const EXCESS_PUNCT = /[._].*[._].*[._]/;

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, Math.round(n)));
}

function normalizeHandle(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().replace(/^@+/, "").toLowerCase();
  return trimmed.replace(/[^a-z0-9._]/g, "");
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0)
    .slice(0, 6);
}

function sanitizeName(raw: unknown, fallback: string): GeneratedYoutubeName | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const name =
    typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : "";
  if (!name) return null;

  const suggestedHandle = normalizeHandle(obj.suggestedHandle) || name.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30);

  let category: YoutubeNameCategory = "hybrid";
  const rawCat = obj.category;
  if (rawCat === "brandable" || rawCat === "searchable" || rawCat === "hybrid") {
    category = rawCat;
  }

  const rawScores =
    (obj.scores as Record<string, unknown> | undefined) ?? {};
  const scores = {
    memorability: clampScore(rawScores.memorability),
    pronounceability: clampScore(rawScores.pronounceability),
    uniqueness: clampScore(rawScores.uniqueness),
    pivotFlexibility: clampScore(rawScores.pivotFlexibility),
  };

  const rawHandle =
    (obj.handleValidation as Record<string, unknown> | undefined) ?? {};
  let formatValid = HANDLE_RULE.test(suggestedHandle);
  const warnings = sanitizeStringArray(rawHandle.warnings);
  let fallbackHandles = sanitizeStringArray(rawHandle.fallbackHandles)
    .map((h) => normalizeHandle(h))
    .filter((h) => h && h !== suggestedHandle)
    .slice(0, 2);

  if (!formatValid) {
    warnings.push("Handle does not match YouTube handle format rules.");
  }
  if (EXCESS_NUMBERS.test(suggestedHandle) && !warnings.some((w) => w.toLowerCase().includes("number"))) {
    warnings.push("Excessive numbers can make a handle look like spam.");
  }
  if (EXCESS_PUNCT.test(suggestedHandle) && !warnings.some((w) => w.toLowerCase().includes("punct"))) {
    warnings.push("Too many dots or underscores can be hard to type.");
  }
  while (fallbackHandles.length < 2) {
    const variant = `${suggestedHandle}${fallbackHandles.length === 0 ? "tv" : "hq"}`.slice(0, 30);
    if (variant !== suggestedHandle && !fallbackHandles.includes(variant)) {
      fallbackHandles.push(variant);
    } else {
      break;
    }
  }

  return {
    name,
    suggestedHandle,
    category,
    oneLineRationale:
      typeof obj.oneLineRationale === "string" && obj.oneLineRationale.trim()
        ? obj.oneLineRationale.trim()
        : "Fits the brief with a memorable angle.",
    bestFor:
      typeof obj.bestFor === "string" && obj.bestFor.trim()
        ? obj.bestFor.trim()
        : "Creators looking for a launch-ready name.",
    scores,
    handleValidation: {
      formatValid,
      warnings: warnings.slice(0, 4),
      fallbackHandles,
    },
  };
}

export function parseYoutubeNameResponse(raw: string): {
  names: GeneratedYoutubeName[];
  recommendedName: string;
  recommendedReason: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("No JSON object found in model output");
    }
    parsed = JSON.parse(raw.slice(start, end + 1));
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model output is not an object");
  }

  const obj = parsed as Record<string, unknown>;
  const rawList = Array.isArray(obj.names) ? obj.names : [];

  const names = rawList
    .map((entry, idx) => sanitizeName(entry, `name-${idx}`))
    .filter((name): name is GeneratedYoutubeName => name !== null)
    .slice(0, 30);

  if (names.length === 0) {
    throw new Error("No usable names in model output");
  }

  const recommendedName =
    typeof obj.recommendedName === "string" && obj.recommendedName.trim()
      ? obj.recommendedName.trim()
      : "";
  const recommendedReason =
    typeof obj.recommendedReason === "string" && obj.recommendedReason.trim()
      ? obj.recommendedReason.trim()
      : "";

  const exists = recommendedName
    ? names.some((n) => n.name.toLowerCase() === recommendedName.toLowerCase())
    : false;

  const finalRecommendedName = exists
    ? recommendedName
    : [...names].sort((a, b) => overall(b.scores) - overall(a.scores))[0].name;
  const finalRecommendedReason = recommendedReason || "";

  return {
    names,
    recommendedName: finalRecommendedName,
    recommendedReason: finalRecommendedReason,
  };
}

export function overall(scores: {
  memorability: number;
  pronounceability: number;
  uniqueness: number;
  pivotFlexibility: number;
}): number {
  return (
    scores.memorability +
    scores.pronounceability +
    scores.uniqueness +
    scores.pivotFlexibility
  );
}
