export type IncorrectQuoteRelationshipMode =
  | "platonic"
  | "rivals"
  | "found_family"
  | "chaotic_team";

export type IncorrectQuoteTone =
  | "absurd"
  | "dry"
  | "sarcastic"
  | "wholesome"
  | "dramatic";

export type IncorrectQuoteLength =
  | "one_liner"
  | "mini_exchange"
  | "extended_exchange";

export type IncorrectQuoteMode = "fast" | "standard" | "creative";

export interface IncorrectQuoteSafetyOptions {
  noRomance: boolean;
  avoidShipping: boolean;
  keepItClean: boolean;
}

export interface IncorrectQuotePromptOptions {
  prompt: string;
  characters: string[];
  relationshipMode: IncorrectQuoteRelationshipMode;
  tone: IncorrectQuoteTone;
  length: IncorrectQuoteLength;
  mode: IncorrectQuoteMode;
  outputLanguage: string;
  safety: IncorrectQuoteSafetyOptions;
}

export interface IncorrectQuoteGenerateRequest {
  prompt?: string;
  locale?: string;
  characters?: string[];
  relationshipMode?: IncorrectQuoteRelationshipMode;
  tone?: IncorrectQuoteTone;
  length?: IncorrectQuoteLength;
  mode?: IncorrectQuoteMode;
  outputLanguage?: string;
  safety?: Partial<IncorrectQuoteSafetyOptions>;
}

export interface NormalizedIncorrectQuoteRequest extends IncorrectQuotePromptOptions {
  locale: string;
}
