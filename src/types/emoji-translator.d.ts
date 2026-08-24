export type EmojiTranslatorMode = "add" | "translate" | "explain";
export type EmojiTranslatorScenario =
  | "caption"
  | "chat_reply"
  | "bio"
  | "just_for_fun";
export type EmojiTranslatorTone = "subtle" | "playful" | "bold";

export interface EmojiTranslatorGenerateRequest {
  text?: string;
  context?: string;
  mode?: EmojiTranslatorMode;
  scenario?: EmojiTranslatorScenario;
  tone?: EmojiTranslatorTone;
  locale?: string;
}

export interface EmojiTranslatorRouteRequest
  extends EmojiTranslatorGenerateRequest {
  turnstileToken?: string;
}

export interface NormalizedEmojiTranslatorRequest {
  text: string;
  context: string;
  mode: EmojiTranslatorMode;
  scenario: EmojiTranslatorScenario;
  tone: EmojiTranslatorTone;
  locale: "en" | "zh" | "de" | "ko" | "ja" | "ru";
}

export interface EmojiTranslatorVariant {
  label: string;
  output: string;
  reason: string;
  caution?: string;
}

export interface EmojiTranslatorResponse {
  variants: [
    EmojiTranslatorVariant,
    EmojiTranslatorVariant,
    EmojiTranslatorVariant
  ];
}
