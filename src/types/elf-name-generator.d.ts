export type ElfHeritage =
  | "moonlit_court"
  | "ancient_woodland"
  | "shadowborne"
  | "sunlit_scholar"
  | "custom";

export type ElfNameStyle =
  | "graceful"
  | "ancient"
  | "fierce"
  | "mysterious"
  | "playful";

export type ElfNameUse = "character" | "family_clan" | "npc_set";

export type ElfNameForm =
  | "feminine"
  | "masculine"
  | "neutral"
  | "mixed";

export type ElfNameLocale = "en" | "zh" | "de" | "ko" | "ja" | "ru";

export type ElfNameModelMode = "fast" | "standard" | "creative";

export interface ElfNameRouteRequest {
  heritage?: unknown;
  style?: unknown;
  nameUse?: unknown;
  nameForm?: unknown;
  roleBackground?: unknown;
  customHeritage?: unknown;
  inspirationName?: unknown;
  locale?: unknown;
  mode?: unknown;
  turnstileToken?: unknown;
}

export interface NormalizedElfNameRequest {
  heritage: ElfHeritage;
  style: ElfNameStyle;
  nameUse: ElfNameUse;
  nameForm: ElfNameForm;
  roleBackground: string;
  customHeritage: string;
  inspirationName: string;
  locale: ElfNameLocale;
  mode: ElfNameModelMode;
}

export interface ElfNameCandidate {
  name: string;
  pronunciation: string;
  meaning: string;
  reason: string;
  tags: string[];
}

export interface ElfNameGeneratorResponse {
  candidates: [
    ElfNameCandidate,
    ElfNameCandidate,
    ElfNameCandidate,
    ElfNameCandidate,
    ElfNameCandidate,
    ElfNameCandidate,
    ElfNameCandidate,
    ElfNameCandidate,
    ElfNameCandidate,
    ElfNameCandidate
  ];
}
