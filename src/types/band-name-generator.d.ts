export type BandGenre =
  | "rock"
  | "metal"
  | "indie"
  | "emo"
  | "pop"
  | "electronic"
  | "hip_hop";

export type BandVibe =
  | "anthemic"
  | "gritty"
  | "dreamy"
  | "playful"
  | "dark"
  | "nostalgic";

export type BandNameLength = "any" | "one_word" | "short" | "phrase";

/**
 * "ai" — identity directions written by the model.
 * "template" — instant, deterministic word-list combinations; no model call.
 */
export type BandMode = "ai" | "template";

/** Model tier for AI mode, mirroring pen-name-generator. */
export type BandModelMode = "fast" | "standard" | "creative";

export type BandOutputLocale = "en" | "zh" | "de" | "ko" | "ja" | "ru";

export interface BandNameRouteRequest {
  genre?: unknown;
  vibe?: unknown;
  length?: unknown;
  mode?: unknown;
  modelMode?: unknown;
  cue?: unknown;
  inspirationName?: unknown;
  locale?: unknown;
  turnstileToken?: unknown;
}

export interface NormalizedBandNameRequest {
  genre: BandGenre;
  vibe: BandVibe;
  length: BandNameLength;
  mode: BandMode;
  modelMode: BandModelMode;
  cue: string;
  inspirationName: string;
  locale: BandOutputLocale;
}

/** Full identity direction returned in AI mode. */
export interface BandIdea {
  name: string;
  pronunciation: string;
  rationale: string;
  genreFit: string;
  bio: string;
  visualDirection: string;
}

/**
 * No-AI result: a name combined from fixed word lists. `pattern` is a stable
 * key the UI localizes; `parts` are the words that were combined.
 */
export interface BandTemplateIdea {
  name: string;
  pattern:
    | "the_adj_noun"
    | "adj_noun"
    | "noun_suffix"
    | "compound_word"
    | "noun_and_the_plural"
    | "cue_suffix";
  parts: string[];
}

export type BandIdeaList = [
  BandIdea,
  BandIdea,
  BandIdea,
  BandIdea,
  BandIdea,
  BandIdea
];

export type BandTemplateIdeaList = [
  BandTemplateIdea,
  BandTemplateIdea,
  BandTemplateIdea,
  BandTemplateIdea,
  BandTemplateIdea,
  BandTemplateIdea
];

export type BandNameGeneratorResponse =
  | { mode: "ai"; ideas: BandIdeaList }
  | { mode: "template"; ideas: BandTemplateIdeaList };
