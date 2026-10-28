import {
  getGenreStoryGeneratorByGenre,
  type GenreStoryKind,
} from "@/lib/genre-story-generators";

export type GenreStoryTitleRequest = {
  genre?: string;
  description?: string;
  locale?: string;
  outputLanguage?: string;
};

export type ParsedGenreStoryTitleRequest = {
  genre: GenreStoryKind;
  description: string;
  locale?: string;
  outputLanguage?: string;
};

export type ParseGenreStoryTitleResult =
  | { ok: true; value: ParsedGenreStoryTitleRequest }
  | { ok: false; error: string };

const TITLE_GENRES: readonly GenreStoryKind[] = [
  "horror",
  "mystery",
  "sci_fi",
  "adventure",
];

const MIN_DESCRIPTION_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 1200;

const GENRE_TITLE_GUIDANCE: Record<GenreStoryKind, string> = {
  horror:
    "Favour dread, a wrong detail, a cursed place, or an unmistakable final image. Avoid generic words such as 'scary' unless the premise earns them.",
  mystery:
    "Favour clues, suspects, a case, atmosphere, or a reveal. Do not give away the solution in the title.",
  sci_fi:
    "Reflect the supplied setting, conflict, technology rule, or human consequence. Avoid generic space words that could describe any story.",
  adventure:
    "Reflect the selected setting, journey, danger, destination, or payoff. Keep the title active and specific.",
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function parseGenreStoryTitleRequest(
  raw: unknown
): ParseGenreStoryTitleResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Invalid request body" };
  }

  const request = raw as Record<string, unknown>;
  const genreValue = (asString(request.genre) || "").trim().toLowerCase();
  const generator = getGenreStoryGeneratorByGenre(genreValue);
  if (!generator || !TITLE_GENRES.includes(generator.genre)) {
    return { ok: false, error: "Unsupported genre" };
  }

  const description = (asString(request.description) || "").trim();
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: `Please describe your premise in at least ${MIN_DESCRIPTION_LENGTH} characters`,
    };
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: `Premise must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`,
    };
  }

  const value: ParsedGenreStoryTitleRequest = {
    genre: generator.genre,
    description,
  };

  const locale = (asString(request.locale) || "").trim();
  if (locale) value.locale = locale.slice(0, 20);
  const outputLanguage = (asString(request.outputLanguage) || "").trim();
  if (outputLanguage) value.outputLanguage = outputLanguage.slice(0, 20);

  return { ok: true, value };
}

export function buildGenreStoryTitlePrompt(
  input: ParsedGenreStoryTitleRequest
): string {
  const genreLabel =
    input.genre === "sci_fi"
      ? "science fiction"
      : input.genre.charAt(0).toUpperCase() + input.genre.slice(1);

  return [
    `You are a title editor for ${genreLabel} fiction.`,
    `Premise: """${input.description}"""`,
    "",
    "Write exactly 5 distinct, marketable titles for this premise.",
    "Return one title per line, with no numbering, no quotation marks, and no explanation.",
    "Return exactly 5 nonempty lines and nothing else.",
    "Do not use the name of an existing franchise, book, film, or game.",
    `Output language: ${input.outputLanguage || input.locale || "English"}.`,
    `Genre guidance: ${GENRE_TITLE_GUIDANCE[input.genre]}`,
    "Do not reveal private chain-of-thought or describe your reasoning.",
  ].join("\n");
}
