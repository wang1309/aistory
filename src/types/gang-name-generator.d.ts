export type GangWorld =
  | "street_crime"
  | "mafia"
  | "fantasy"
  | "cyberpunk"
  | "post_apocalyptic"
  | "biker"
  | "game_world";

export type GangGroupType =
  | "crew"
  | "crime_family"
  | "syndicate"
  | "brotherhood"
  | "clan"
  | "biker_club";

export type GangTone =
  | "menacing"
  | "gritty"
  | "cunning"
  | "flashy"
  | "funny"
  | "honorable";

export type GangFlavor =
  | "none"
  | "italian"
  | "japanese"
  | "chinese"
  | "western"
  | "nordic";

export type GangOutputLocale = "en" | "zh" | "de" | "ko" | "ja" | "ru";

export type GangNameModelMode = "fast" | "standard" | "creative";

export interface GangNameRouteRequest {
  world?: unknown;
  groupType?: unknown;
  tone?: unknown;
  flavor?: unknown;
  cue?: unknown;
  inspirationName?: unknown;
  locale?: unknown;
  mode?: unknown;
  turnstileToken?: unknown;
}

export interface NormalizedGangNameRequest {
  world: GangWorld;
  groupType: GangGroupType;
  tone: GangTone;
  flavor: GangFlavor;
  cue: string;
  inspirationName: string;
  locale: GangOutputLocale;
  mode: GangNameModelMode;
}

export interface GangProfile {
  name: string;
  meaning: string;
  reputation: string;
  territory: string;
  symbol: string;
  coreValue: string;
  rivalHook: string;
}

export interface GangNameGeneratorResponse {
  profiles: [
    GangProfile,
    GangProfile,
    GangProfile,
    GangProfile,
    GangProfile,
    GangProfile
  ];
}
