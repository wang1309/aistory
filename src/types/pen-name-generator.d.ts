export type PenNameGenre =
  | "romance"
  | "thriller_mystery"
  | "fantasy"
  | "science_fiction"
  | "literary"
  | "non_fiction"
  | "general";

export type PenNameBrandGoal =
  | "single_brand"
  | "separate_genres"
  | "privacy_first"
  | "initials_led";

export type PenNameTone =
  | "classic"
  | "warm"
  | "bold"
  | "mysterious"
  | "modern"
  | "scholarly";

export type PenNameForm =
  | "full_name"
  | "first_initial"
  | "initials_surname"
  | "single_name";

export type PenNameMarket = "en" | "zh" | "de" | "ko" | "ja" | "ru";

export type PenNameModelMode = "fast" | "standard" | "creative";

export interface PenNameRouteRequest {
  genre?: unknown;
  brandGoal?: unknown;
  tone?: unknown;
  nameForm?: unknown;
  targetMarket?: unknown;
  cue?: unknown;
  inspirationName?: unknown;
  locale?: unknown;
  mode?: unknown;
  turnstileToken?: unknown;
}

export interface NormalizedPenNameRequest {
  genre: PenNameGenre;
  brandGoal: PenNameBrandGoal;
  tone: PenNameTone;
  nameForm: PenNameForm;
  targetMarket: PenNameMarket;
  cue: string;
  inspirationName: string;
  locale: PenNameMarket;
  mode: PenNameModelMode;
}

export interface PenNameCandidate {
  name: string;
  pronunciation: string;
  reason: string;
  tags: string[];
}

export interface PenNameGeneratorResponse {
  candidates: [
    PenNameCandidate,
    PenNameCandidate,
    PenNameCandidate,
    PenNameCandidate,
    PenNameCandidate,
    PenNameCandidate,
    PenNameCandidate,
    PenNameCandidate,
    PenNameCandidate,
    PenNameCandidate
  ];
}
