import {
  GENRE_STORY_COMMON_OPTION_VALUES,
  getGenreStoryGeneratorByGenre,
  getGenreStoryOptionPromptLabel,
  type GenreStoryGenerator,
  type GenreStoryKind,
} from "@/lib/genre-story-generators";

export type GenreStoryRequest = {
  genre?: string;
  prompt?: string;
  model?: string;
  locale?: string;
  outputLanguage?: string;
  length?: string;
  tone?: string;
  perspective?: string;
  audience?: string;
  options?: Record<string, string | undefined>;
};

export type GenreStoryModel = "fast" | "standard" | "creative";

export type ParsedGenreStoryRequest = {
  genre: GenreStoryKind;
  prompt: string;
  model: GenreStoryModel;
  locale?: string;
  outputLanguage?: string;
  length: string;
  tone?: string;
  perspective?: string;
  audience?: string;
  options: Record<string, string>;
};

export type ParseGenreStoryRequestResult =
  | { ok: true; value: ParsedGenreStoryRequest }
  | { ok: false; error: string };

const MAX_IDEA_LENGTH = 2000;

const MODEL_VALUES: readonly GenreStoryModel[] = [
  "fast",
  "standard",
  "creative",
];

const LENGTH_LABELS: Record<string, string> = {
  two_sentence: "Exactly two sentences",
  hook: "Exactly two opening lines (a hook)",
  short: "A short story of roughly 600-900 words",
  full: "A full story of roughly 1,500-2,000 words",
  full_outline: "A complete plot outline with acts, turning points, and an ending",
  branching_path:
    "A static branching outline with one scene and two or three numbered choices",
};

const GENRE_REQUIREMENTS: Record<GenreStoryKind, string> = {
  horror:
    "Build dread through the selected horror mode and intensity; honour the requested ending without gratuitous gore. For two-sentence output, deliver one compact setup and one unmistakable turn.",
  mystery:
    "Build the plot around clues, misdirection, and final solution: plant fair clues, distinguish red herrings from evidence, and make the final solution logically follow from what the reader has seen. For hook output, write exactly two lines that establish the case and a compelling unanswered question.",
  sci_fi:
    "Apply the selected science-fiction mode and world rules consistently; show the human consequences of the technology. Keep the speculation internally coherent and avoid explaining the rules longer than the story needs.",
  adventure:
    "Give the protagonist a concrete goal, escalating obstacles, travel or discovery, an opposing force, and an earned payoff. For branching_path output, return a \"Scene:\" section followed by a \"Choices:\" section with two or three meaningful choices, numbered. Each choice must state a distinct immediate consequence. This is a static branching outline: do not tell the reader they can click through it, and do not claim it is a game.",
};

const LENGTH_ALIASES: Record<string, string> = {
  two_sentences: "two_sentence",
  two_sentence: "two_sentence",
  hook: "hook",
  short: "short",
  full: "full",
  full_outline: "full_outline",
  branching_path: "branching_path",
  branching_outline: "branching_path",
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function normalizeModel(value: unknown): GenreStoryModel {
  const candidate = (asString(value) || "").trim().toLowerCase();
  return (MODEL_VALUES as readonly string[]).includes(candidate)
    ? (candidate as GenreStoryModel)
    : "standard";
}

function normalizeLength(
  value: unknown,
  generator: GenreStoryGenerator
): string {
  const candidate = (asString(value) || "").trim().toLowerCase();
  const resolved = LENGTH_ALIASES[candidate] || candidate;
  return generator.lengths.includes(resolved)
    ? resolved
    : generator.defaultLength;
}

function normalizeCommonOption(
  value: unknown,
  key: keyof typeof GENRE_STORY_COMMON_OPTION_VALUES
): string | undefined {
  const candidate = (asString(value) || "").trim().toLowerCase();
  if (!candidate || candidate === "none") return undefined;
  return GENRE_STORY_COMMON_OPTION_VALUES[key].includes(
    candidate as never
  )
    ? candidate
    : undefined;
}

function parseOptions(
  value: unknown,
  generator: GenreStoryGenerator
): Record<string, string> {
  const raw = asRecord(value);
  if (!raw) return {};

  const parsed: Record<string, string> = {};
  for (const key of generator.optionKeys) {
    const candidate = asString(raw[key]);
    if (!candidate) continue;
    const normalized = candidate.trim().toLowerCase();
    if (generator.optionValues[key]?.includes(normalized)) {
      parsed[key] = normalized;
    }
  }
  return parsed;
}

export function parseGenreStoryRequest(
  raw: unknown
): ParseGenreStoryRequestResult {
  const request = asRecord(raw);
  if (!request) {
    return { ok: false, error: "Invalid request body" };
  }

  const genreValue = (asString(request.genre) || "").trim().toLowerCase();
  const generator = getGenreStoryGeneratorByGenre(genreValue);
  if (!generator) {
    return { ok: false, error: "Unsupported genre" };
  }

  const prompt = (asString(request.prompt) || "").trim();
  if (!prompt) {
    return { ok: false, error: "Please enter your story idea" };
  }

  if (prompt.length > MAX_IDEA_LENGTH) {
    return {
      ok: false,
      error: `Story idea must be ${MAX_IDEA_LENGTH} characters or fewer`,
    };
  }

  const value: ParsedGenreStoryRequest = {
    genre: generator.genre,
    prompt,
    model: normalizeModel(request.model),
    length: normalizeLength(request.length, generator),
    options: parseOptions(request.options, generator),
  };

  const locale = (asString(request.locale) || "").trim();
  if (locale) value.locale = locale.slice(0, 20);

  const outputLanguage = (asString(request.outputLanguage) || "").trim();
  if (outputLanguage) value.outputLanguage = outputLanguage.slice(0, 20);

  const tone = normalizeCommonOption(request.tone, "tone");
  if (tone) value.tone = tone;
  const perspective = normalizeCommonOption(request.perspective, "perspective");
  if (perspective) value.perspective = perspective;
  const audience = normalizeCommonOption(request.audience, "audience");
  if (audience) value.audience = audience;

  return { ok: true, value };
}

function buildOptionLines(input: ParsedGenreStoryRequest): string[] {
  const generator = getGenreStoryGeneratorByGenre(input.genre);
  if (!generator) return [];

  const lines: string[] = [];
  for (const key of generator.optionKeys) {
    const value = input.options[key];
    if (!value) continue;
    lines.push(`- ${key}: ${getGenreStoryOptionPromptLabel(key, value)}`);
  }
  return lines;
}

export function buildGenreStoryPrompt(input: ParsedGenreStoryRequest): string {
  const generator = getGenreStoryGeneratorByGenre(input.genre);
  const genreLabel =
    input.genre === "sci_fi"
      ? "science fiction"
      : input.genre.charAt(0).toUpperCase() + input.genre.slice(1);

  const lengthLabel =
    LENGTH_LABELS[input.length] || LENGTH_LABELS.short;

  const lines: string[] = [
    `Write a ${genreLabel} story for a reader who wants a complete, publishable draft.`,
    `Output language: ${input.outputLanguage || input.locale || "English"}.`,
    "",
    "Story idea:",
    '"""',
    input.prompt,
    '"""',
    "",
    "Creative requirements:",
    `- Genre: ${genreLabel}`,
    `- Output length: ${lengthLabel}`,
    `- Genre-specific contract: ${GENRE_REQUIREMENTS[input.genre]}`,
  ];

  if (input.tone) {
    lines.push(
      `- Tone: ${getGenreStoryOptionPromptLabel("tone", input.tone)}`
    );
  }
  if (input.perspective) {
    lines.push(
      `- Point of view: ${getGenreStoryOptionPromptLabel(
        "perspective",
        input.perspective
      )}`
    );
  }
  if (input.audience) {
    lines.push(
      `- Audience: ${getGenreStoryOptionPromptLabel(
        "audience",
        input.audience
      )}`
    );
  }

  lines.push(...buildOptionLines(input));

  if (input.length === "branching_path") {
    lines.push(
      "",
      "For this branching outline, use exactly this readable structure:",
      "Scene:",
      "<the current scene>",
      "Choices:",
      "1. <choice and its immediate consequence>",
      "2. <choice and its immediate consequence>",
      "3. <optional third choice>",
      "",
      "Return two or three meaningful choices in total. Do not output interactive UI claims, links, or a game interface."
    );
  }

  lines.push(
    "",
    "Constraints:",
    "- Do not copy the plot, characters, or title of an existing franchise.",
    "- Do not mention that you are an AI or describe your reasoning.",
    "- Do not reveal private chain-of-thought or analysis.",
    "- Return only the requested story or outline, with no preamble or explanation."
  );

  return lines.join("\n");
}
