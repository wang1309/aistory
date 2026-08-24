import type {
  EmojiTranslatorMode,
  EmojiTranslatorResponse,
  EmojiTranslatorScenario,
  EmojiTranslatorTone,
  EmojiTranslatorVariant,
  NormalizedEmojiTranslatorRequest,
} from "@/types/emoji-translator";

const MODES = ["add", "translate", "explain"] as const;
const SCENARIOS = [
  "caption",
  "chat_reply",
  "bio",
  "just_for_fun",
] as const;
const TONES = ["subtle", "playful", "bold"] as const;
const LOCALES = ["en", "zh", "de", "ko", "ja", "ru"] as const;

const OUTPUT_LANGUAGES = {
  en: "English",
  zh: "Simplified Chinese",
  de: "German",
  ko: "Korean",
  ja: "Japanese",
  ru: "Russian",
} as const;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAllowed<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

export function normalizeEmojiTranslatorRequest(
  input: {
    text?: unknown;
    context?: unknown;
    mode?: unknown;
    scenario?: unknown;
    tone?: unknown;
    locale?: unknown;
  }
): NormalizedEmojiTranslatorRequest {
  const localeRaw = clean(input.locale);
  const locale = normalizeAllowed(localeRaw, LOCALES, "en") as
    | "en"
    | "zh"
    | "de"
    | "ko"
    | "ja"
    | "ru";

  return {
    text: clean(input.text),
    context: clean(input.context),
    mode: normalizeAllowed(input.mode, MODES, "add"),
    scenario: normalizeAllowed(input.scenario, SCENARIOS, "chat_reply"),
    tone: normalizeAllowed(input.tone, TONES, "subtle"),
    locale,
  };
}

function modeInstruction(mode: EmojiTranslatorMode): string {
  switch (mode) {
    case "add":
      return "Mode 'add': append fitting emoji to the source message without rewriting its words. Keep the original text intact and add emoji that reinforce the meaning.";
    case "translate":
      return "Mode 'translate': rewrite the source message into an emoji-forward version that conveys the same meaning, using emoji alongside or in place of words where natural.";
    case "explain":
      return "Mode 'explain': interpret the emoji meaning of the source message. Provide a possible interpretation, but do NOT present any single explanation as definitive — emoji meaning depends heavily on context, relationship, and culture.";
  }
}

function scenarioInstruction(scenario: EmojiTranslatorScenario): string {
  switch (scenario) {
    case "caption":
      return "Scenario 'caption': the result reads like a social caption or post text.";
    case "chat_reply":
      return "Scenario 'chat_reply': the result reads like a reply inside a messaging app conversation.";
    case "bio":
      return "Scenario 'bio': the result is short and fits a profile bio.";
    case "just_for_fun":
      return "Scenario 'just_for_fun': the result is playful and casual.";
  }
}

function toneInstruction(tone: EmojiTranslatorTone): string {
  switch (tone) {
    case "subtle":
      return "Tone 'subtle': restrained, one or two emoji max, low-key.";
    case "playful":
      return "Tone 'playful': a few lively emoji, upbeat.";
    case "bold":
      return "Tone 'bold': expressive, multiple emoji, high energy.";
  }
}

export function buildEmojiTranslatorPrompt(
  input: NormalizedEmojiTranslatorRequest
): string {
  const language = OUTPUT_LANGUAGES[input.locale];

  return [
    "You are an emoji translator. Produce exactly 3 distinct variants for the user's message.",
    "Return valid JSON only. JSON only, no prose before or after.",
    `Source text: ${input.text}`,
    `Context: ${input.context || "not provided"}`,
    modeInstruction(input.mode),
    scenarioInstruction(input.scenario),
    toneInstruction(input.tone),
    `Write all explanations in ${language}.`,
    "Each variant must give a possible interpretation of how the emoji read in this context.",
    "Required fields for each variant: label, output, reason, and optional caution.",
    "Each variant must have a short label (e.g. Subtle, Playful, Bold), the output text (with emoji), a reason explaining the emoji choice, and an optional caution flagging ambiguity or a meaning that could be misread in this context.",
    "In 'explain' mode, the reason must describe a possible interpretation, never a definitive one.",
    "Do not introduce harmful, sexualized, or slur-based substitutions. Do not change the original intent of the message.",
    'Output shape: {"variants":[{"label":"","output":"","reason":"","caution":""}]}',
  ].join("\n");
}

function unwrapFenced(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? raw.trim();
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseEmojiTranslatorResponse(
  raw: string
): EmojiTranslatorResponse {
  const jsonText = unwrapFenced(raw);
  const parsed = JSON.parse(jsonText) as { variants?: unknown };

  const list = Array.isArray(parsed.variants) ? parsed.variants : [];
  const variants = list
    .map((item): EmojiTranslatorVariant | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (!isNonEmpty(obj.label) || !isNonEmpty(obj.output) || !isNonEmpty(obj.reason)) {
        return null;
      }
      const variant: EmojiTranslatorVariant = {
        label: obj.label.trim(),
        output: obj.output.trim(),
        reason: obj.reason.trim(),
      };
      if (isNonEmpty(obj.caution)) {
        variant.caution = obj.caution.trim();
      }
      return variant;
    })
    .filter((item): item is EmojiTranslatorVariant => item !== null);

  if (variants.length !== 3) {
    throw new Error("Expected three complete variants");
  }

  return {
    variants: [variants[0], variants[1], variants[2]],
  };
}

export async function generateEmojiTranslation(
  input: NormalizedEmojiTranslatorRequest
): Promise<EmojiTranslatorResponse> {
  const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GRSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gemini-3.1-flash-lite",
      stream: false,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: buildEmojiTranslatorPrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`upstream responded with status ${response.status}`);
  }

  const json = await response.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";

  return parseEmojiTranslatorResponse(content);
}
