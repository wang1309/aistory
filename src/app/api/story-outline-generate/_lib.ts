import type {
  GeneratedStoryOutline,
  StoryOutlineAudience,
  StoryOutlineGenerateRequest,
  StoryOutlineGenre,
  StoryOutlineTargetLength,
  StoryOutlineTone,
} from "@/types/story-outline";

const SUPPORTED_GENRES: StoryOutlineGenre[] = [
  "fantasy",
  "romance",
  "thriller",
  "sci-fi",
  "mystery",
  "literary",
  "general",
];

const SUPPORTED_TONES: StoryOutlineTone[] = [
  "hopeful",
  "dark",
  "funny",
  "emotional",
  "tense",
  "epic",
];

const SUPPORTED_LENGTHS: StoryOutlineTargetLength[] = [
  "short-story",
  "novella",
  "novel",
];

const SUPPORTED_AUDIENCES: StoryOutlineAudience[] = [
  "kids",
  "middle-grade",
  "ya",
  "adult",
];

function stripCodeFences(input: string): string {
  return input
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function first<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

export function normalizeStoryOutlineRequest(
  input: StoryOutlineGenerateRequest
): Required<Omit<StoryOutlineGenerateRequest, "turnstileToken">> {
  const genre = SUPPORTED_GENRES.includes(input.genre as StoryOutlineGenre)
    ? (input.genre as StoryOutlineGenre)
    : "general";
  const tone = SUPPORTED_TONES.includes(input.tone as StoryOutlineTone)
    ? (input.tone as StoryOutlineTone)
    : "hopeful";
  const targetLength = SUPPORTED_LENGTHS.includes(
    input.targetLength as StoryOutlineTargetLength
  )
    ? (input.targetLength as StoryOutlineTargetLength)
    : "novel";
  const audience = SUPPORTED_AUDIENCES.includes(
    input.audience as StoryOutlineAudience
  )
    ? (input.audience as StoryOutlineAudience)
    : "adult";

  return {
    storyIdea: input.storyIdea?.trim() ?? "",
    genre,
    tone,
    targetLength,
    audience,
    locale: first(input.locale?.trim(), "en"),
  };
}

export function buildStoryOutlinePrompt(
  input: ReturnType<typeof normalizeStoryOutlineRequest>
): string {
  return [
    "You are a story-development assistant for new fiction writers.",
    "Convert the user's idea into a clean, usable outline.",
    "Return JSON only with these top-level keys: premise, coreConflict, storyArc, keyBeats, nextStepTeaser.",
    "coreConflict must contain protagonistGoal, opposition, stakes, urgency.",
    "storyArc must contain opening, escalation, midpoint, crisis, climax, resolution.",
    "keyBeats must contain 6-8 items, each with label, summary, purpose.",
    "Keep the writing concrete, specific, and free of filler.",
    `Story idea: ${input.storyIdea}`,
    `Genre: ${input.genre}`,
    `Tone: ${input.tone}`,
    `Target length: ${input.targetLength}`,
    `Audience: ${input.audience}`,
    `Output language: ${input.locale}`,
  ].join("\n");
}

export function parseStoryOutlineResponse(
  rawContent: string
): GeneratedStoryOutline {
  const parsed = JSON.parse(stripCodeFences(rawContent)) as GeneratedStoryOutline;

  if (!parsed?.premise?.trim()) {
    throw new Error("outline premise missing");
  }

  if (!Array.isArray(parsed.keyBeats) || parsed.keyBeats.length < 2) {
    throw new Error("outline beats missing");
  }

  return {
    premise: parsed.premise.trim(),
    coreConflict: {
      protagonistGoal: parsed.coreConflict?.protagonistGoal?.trim() ?? "",
      opposition: parsed.coreConflict?.opposition?.trim() ?? "",
      stakes: parsed.coreConflict?.stakes?.trim() ?? "",
      urgency: parsed.coreConflict?.urgency?.trim() ?? "",
    },
    storyArc: {
      opening: parsed.storyArc?.opening?.trim() ?? "",
      escalation: parsed.storyArc?.escalation?.trim() ?? "",
      midpoint: parsed.storyArc?.midpoint?.trim() ?? "",
      crisis: parsed.storyArc?.crisis?.trim() ?? "",
      climax: parsed.storyArc?.climax?.trim() ?? "",
      resolution: parsed.storyArc?.resolution?.trim() ?? "",
    },
    keyBeats: parsed.keyBeats.map((beat) => ({
      label: beat.label.trim(),
      summary: beat.summary.trim(),
      purpose: beat.purpose.trim(),
    })),
    nextStepTeaser:
      parsed.nextStepTeaser?.trim() ||
      "Expand this outline into chapters to make it easier to write.",
  };
}
