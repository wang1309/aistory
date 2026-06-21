import type {
  GeneratedYoutubeTitle,
  NormalizedYoutubeTitleRequest,
  YoutubeTitleAngle,
  YoutubeTitleGenerateRequest,
  YoutubeTitleGenerateResponse,
  YoutubeTitleKeywordPlacement,
  YoutubeTitleLengthPreference,
  YoutubeTitleOptimizationPreference,
  YoutubeTitleRisk,
} from "@/types/youtube-title";

const LENGTHS: readonly YoutubeTitleLengthPreference[] = [
  "short",
  "medium",
  "flexible",
];

const PREFERENCES: readonly YoutubeTitleOptimizationPreference[] = [
  "search",
  "balanced",
  "clicks",
];

const ANGLES: readonly YoutubeTitleAngle[] = [
  "search-first",
  "curiosity-first",
  "outcome-first",
  "contrarian-first",
];

const LENGTH_GUIDANCE: Record<YoutubeTitleLengthPreference, string> = {
  short: "Keep titles tight and front-loaded (target ~40-50 characters).",
  medium: "Aim for 50-60 characters so the promise reads in browse results.",
  flexible: "Optimize for clarity and impact; length can flex between 40-70 characters.",
};

const PREFERENCE_GUIDANCE: Record<YoutubeTitleOptimizationPreference, string> = {
  search:
    "Prioritize search intent: include the core topic phrase viewers would type into YouTube search.",
  balanced:
    "Balance search visibility with curiosity hooks; the title must read naturally and earn the click.",
  clicks:
    "Lead with curiosity and emotion; keep the promise specific so it does not feel like clickbait.",
};

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizeAllowed<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

export function normalizeYoutubeTitleRequest(
  input: YoutubeTitleGenerateRequest & { locale?: string }
): NormalizedYoutubeTitleRequest {
  return {
    videoTopic: clean(input.videoTopic),
    targetAudience: clean(input.targetAudience),
    summary: clean(input.summary),
    transcript: clean(input.transcript),
    titleLengthPreference: normalizeAllowed(
      input.titleLengthPreference,
      LENGTHS,
      "medium"
    ),
    optimizationPreference: normalizeAllowed(
      input.optimizationPreference,
      PREFERENCES,
      "balanced"
    ),
    avoidWords: Array.isArray(input.avoidWords)
      ? input.avoidWords.map((value) => clean(value)).filter(Boolean)
      : [],
    locale: clean(input.locale) || "en",
  };
}

export function assessTruncationRisk(title: string): YoutubeTitleRisk {
  if (title.length >= 55) return "high";
  if (title.length >= 45) return "medium";
  return "low";
}

export function detectKeywordPlacement(
  title: string,
  topic: string
): YoutubeTitleKeywordPlacement {
  const titleLower = title.toLowerCase();
  const keywords = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const primaryKeyword = keywords[0];
  if (!primaryKeyword || !titleLower.includes(primaryKeyword)) return "none";

  const idx = titleLower.indexOf(primaryKeyword);
  if (idx <= 10) return "front-loaded";
  if (idx <= 28) return "mid-title";
  return "late";
}

export function detectAuthenticityRisk(title: string): YoutubeTitleRisk {
  const upperHeavy = /[A-Z]{4,}/.test(title);
  const hypeTerms =
    /(secret|explode|guaranteed|instantly|10x|shocking|insane|crazy|unbelievable)/i.test(
      title
    );
  if (upperHeavy || hypeTerms) return "high";
  if (/[!?]{2,}/.test(title)) return "medium";
  return "low";
}

export function buildYoutubeTitlePrompt(
  input: NormalizedYoutubeTitleRequest
): string {
  const lines: string[] = [
    "You are a YouTube packaging strategist helping an actively publishing creator choose a better title before publishing.",
    "Return only valid JSON. No markdown fences, no trailing commas, no prose.",
    "",
    "## Video Brief",
    `- Video topic: ${input.videoTopic}`,
    `- Target audience: ${input.targetAudience}`,
    `- Summary: ${input.summary}`,
    `- Transcript: ${input.transcript || "Not provided."}`,
    `- Length preference: ${input.titleLengthPreference} — ${LENGTH_GUIDANCE[input.titleLengthPreference]}`,
    `- Optimization preference: ${input.optimizationPreference} — ${PREFERENCE_GUIDANCE[input.optimizationPreference]}`,
    `- Avoid words: ${input.avoidWords.join(", ") || "none"}`,
    `- Output language: ${input.locale}`,
    "",
    "## Title Angles (generate 3 per angle, 12 total)",
    "1. search-first: titles built around what viewers type into YouTube search. Front-load the topic keywords and keep the promise clear.",
    "2. curiosity-first: titles that open an information gap viewers want to close. Specific, not clickbait.",
    "3. outcome-first: titles that lead with the payoff the viewer gets. Concrete result, not vague hype.",
    "4. contrarian-first: titles that take a position against the common approach. Useful when the creator wants to stand out.",
    "",
    "## Quality Bar",
    "- Every title must be distinct and tied to the actual video content.",
    "- Avoid bland AI phrasing and empty clickbait.",
    "- Respect the avoid-words list — none of those words should appear in any title.",
    "- Match the requested length and optimization preferences.",
    "",
    "## Output Format (strict JSON)",
    'JSON shape: {"titles":[{"title":"","angle":"","oneLineReason":"","bestUseCase":""}],"recommendedTitle":"","recommendedReason":"","backupTitle":""}',
    "- angle must be one of: search-first, curiosity-first, outcome-first, contrarian-first.",
    "- oneLineReason: a single short sentence explaining why this title earns the click.",
    "- bestUseCase: a single short phrase describing where this title works best (search traffic, browse traffic, etc.).",
    "- recommendedTitle: the single strongest title across all 12 candidates.",
    "- recommendedReason: a single short sentence explaining the recommendation.",
    "- backupTitle: a different angle from the recommended title that the creator can fall back to.",
  ];

  return lines.join("\n");
}

export function pickRecommendedTitle(
  titles: GeneratedYoutubeTitle[]
): GeneratedYoutubeTitle {
  const score = (t: GeneratedYoutubeTitle) =>
    (t.truncationRisk === "low" ? 2 : t.truncationRisk === "medium" ? 1 : 0) +
    (t.keywordPlacement === "front-loaded"
      ? 2
      : t.keywordPlacement === "mid-title"
        ? 1
        : 0) +
    (t.authenticityRisk === "low"
      ? 2
      : t.authenticityRisk === "medium"
        ? 1
        : 0);

  return [...titles].sort((a, b) => score(b) - score(a))[0];
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

function coerceAngle(value: unknown): YoutubeTitleAngle | null {
  return typeof value === "string" && ANGLES.includes(value as YoutubeTitleAngle)
    ? (value as YoutubeTitleAngle)
    : null;
}

function sanitizeTitle(
  raw: unknown,
  topic: string,
  fallbackIndex: number
): GeneratedYoutubeTitle | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const title =
    typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : "";
  if (!title) return null;

  const angle = coerceAngle(obj.angle) ?? "search-first";
  const oneLineReason =
    typeof obj.oneLineReason === "string" && obj.oneLineReason.trim()
      ? obj.oneLineReason.trim()
      : "Fits the video brief and earns the click.";
  const bestUseCase =
    typeof obj.bestUseCase === "string" && obj.bestUseCase.trim()
      ? obj.bestUseCase.trim()
      : `Title option ${fallbackIndex + 1}`;

  return {
    title,
    angle,
    characterCount: title.length,
    truncationRisk: assessTruncationRisk(title),
    keywordPlacement: detectKeywordPlacement(title, topic),
    authenticityRisk: detectAuthenticityRisk(title),
    oneLineReason,
    bestUseCase,
  };
}

export function parseYoutubeTitleResponse(
  raw: string,
  topic: string
): YoutubeTitleGenerateResponse {
  const cleaned = stripCodeFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("No JSON object found in model output");
    }
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model output is not an object");
  }

  const obj = parsed as Record<string, unknown>;
  const rawList = Array.isArray(obj.titles) ? obj.titles : [];

  const titles = rawList
    .map((entry, idx) => sanitizeTitle(entry, topic, idx))
    .filter((t): t is GeneratedYoutubeTitle => t !== null)
    .slice(0, 24);

  if (titles.length === 0) {
    throw new Error("No usable titles in model output");
  }

  const recommendedTitleRaw =
    typeof obj.recommendedTitle === "string" &&
    obj.recommendedTitle.trim()
      ? obj.recommendedTitle.trim()
      : "";

  const recommendedReason =
    typeof obj.recommendedReason === "string" &&
    obj.recommendedReason.trim()
      ? obj.recommendedReason.trim()
      : "";

  const backupTitleRaw =
    typeof obj.backupTitle === "string" && obj.backupTitle.trim()
      ? obj.backupTitle.trim()
      : "";

  const recommendedExists = recommendedTitleRaw
    ? titles.some(
        (t) => t.title.toLowerCase() === recommendedTitleRaw.toLowerCase()
      )
    : false;

  const recommendedTitle = recommendedExists
    ? recommendedTitleRaw
    : (pickRecommendedTitle(titles).title ?? "");

  const backupExists = backupTitleRaw
    ? titles.some((t) => t.title.toLowerCase() === backupTitleRaw.toLowerCase())
    : false;

  const backupTitle = backupExists
    ? backupTitleRaw
    : (titles.find(
        (t) => t.title.toLowerCase() !== recommendedTitle.toLowerCase()
      )?.title ?? "");

  return {
    titles,
    recommendedTitle,
    recommendedReason,
    backupTitle,
  };
}
