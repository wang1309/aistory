export type MiddleNameUseCase = "fictional_character" | "pen_name";

export type MiddleNameSetting =
  | "contemporary"
  | "mystery_thriller"
  | "romance"
  | "fantasy"
  | "historical"
  | "science_fiction"
  | "literary";

export type MiddleNameEra =
  | "any"
  | "contemporary"
  | "mid_20th"
  | "early_20th"
  | "victorian"
  | "timeless";

export type MiddleNameTone =
  | "restrained"
  | "formal"
  | "old_money"
  | "rebellious"
  | "inherited"
  | "warm"
  | "mysterious";

export type MiddleNameCadence = "any" | "short" | "long";

export type MiddleNameOutputLocale = "en" | "zh" | "de" | "ko" | "ja" | "ru";

export type MiddleNameModelMode = "fast" | "standard" | "creative";

export interface MiddleNameRouteRequest {
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
  turnstileToken?: unknown;
}

export interface NormalizedMiddleNameRequest {
  useCase: MiddleNameUseCase;
  firstName: string;
  lastName: string;
  setting: MiddleNameSetting;
  era: MiddleNameEra;
  tone: MiddleNameTone;
  cadence: MiddleNameCadence;
  avoidInitials: string;
  note: string;
  locale: MiddleNameOutputLocale;
  mode: MiddleNameModelMode;
}

export interface MiddleNameDirection {
  middleName: string;
  fullName: string;
  cadenceNote: string;
  implication: string;
  tags: string[];
}

export interface MiddleNameGeneratorResponse {
  directions: [
    MiddleNameDirection,
    MiddleNameDirection,
    MiddleNameDirection
  ];
}
