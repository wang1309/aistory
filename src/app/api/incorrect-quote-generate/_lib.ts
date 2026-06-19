import type {
  IncorrectQuoteGenerateRequest,
  IncorrectQuoteLength,
  IncorrectQuoteMode,
  IncorrectQuotePromptOptions,
  IncorrectQuoteRelationshipMode,
  IncorrectQuoteSafetyOptions,
  IncorrectQuoteTone,
  NormalizedIncorrectQuoteRequest,
} from "@/types/incorrect-quote";

const RELATIONSHIP_MODES: readonly IncorrectQuoteRelationshipMode[] = [
  "platonic",
  "rivals",
  "found_family",
  "chaotic_team",
];
const TONES: readonly IncorrectQuoteTone[] = [
  "absurd",
  "dry",
  "sarcastic",
  "wholesome",
  "dramatic",
];
const LENGTHS: readonly IncorrectQuoteLength[] = [
  "one_liner",
  "mini_exchange",
  "extended_exchange",
];
const MODES: readonly IncorrectQuoteMode[] = ["fast", "standard", "creative"];

const LENGTH_GUIDANCE = {
  one_liner: "1-2 short speaker-labelled lines",
  mini_exchange: "2-4 short speaker-labelled lines",
  extended_exchange: "4-6 short speaker-labelled lines",
};

const RELATIONSHIP_GUIDANCE = {
  platonic: "friendly, non-romantic character chemistry",
  rivals: "competitive, sniping, or one-upmanship energy",
  found_family: "protective, familiar, found family warmth",
  chaotic_team: "messy team energy, bad coordination, and group chaos",
} satisfies Record<IncorrectQuoteRelationshipMode, string>;

const TONE_GUIDANCE = {
  absurd: "push the humor toward ridiculous escalation",
  dry: "keep the humor understated, deadpan, and restrained",
  sarcastic: "make the lines sharper, more biting, and more openly snarky",
  wholesome: "keep the humor warm, affectionate, and light",
  dramatic: "make the reactions overblown, intense, and theatrical",
} satisfies Record<IncorrectQuoteTone, string>;

const DEFAULTS = {
  locale: "en",
  relationshipMode: "platonic",
  tone: "absurd",
  length: "mini_exchange",
  mode: "standard",
  outputLanguage: "en",
  safety: {
    noRomance: false,
    avoidShipping: false,
    keepItClean: false,
  } satisfies IncorrectQuoteSafetyOptions,
} as const;

const MAX_USABLE_CHARACTER_NAMES = 6;

function cleanText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeAllowedOption<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

export function normalizeIncorrectQuoteRequest(
  input: IncorrectQuoteGenerateRequest
): NormalizedIncorrectQuoteRequest {
  const locale = cleanText(input.locale) || DEFAULTS.locale;
  const prompt = cleanText(input.prompt);
  const characters = (input.characters ?? [])
    .map((name) => cleanText(name))
    .filter(Boolean)
    .slice(0, MAX_USABLE_CHARACTER_NAMES);
  const relationshipMode = normalizeAllowedOption(
    input.relationshipMode,
    RELATIONSHIP_MODES,
    DEFAULTS.relationshipMode
  );
  const tone = normalizeAllowedOption(input.tone, TONES, DEFAULTS.tone);
  const length = normalizeAllowedOption(input.length, LENGTHS, DEFAULTS.length);
  const mode = normalizeAllowedOption(input.mode, MODES, DEFAULTS.mode);
  const outputLanguage = cleanText(input.outputLanguage) || DEFAULTS.outputLanguage;

  return {
    prompt,
    locale,
    characters,
    relationshipMode,
    tone,
    length,
    mode,
    outputLanguage,
    safety: {
      noRomance: normalizeBoolean(
        input.safety?.noRomance,
        DEFAULTS.safety.noRomance
      ),
      avoidShipping: normalizeBoolean(
        input.safety?.avoidShipping,
        DEFAULTS.safety.avoidShipping
      ),
      keepItClean: normalizeBoolean(
        input.safety?.keepItClean,
        DEFAULTS.safety.keepItClean
      ),
    },
  };
}

export function buildIncorrectQuotePrompt(options: IncorrectQuotePromptOptions): string {
  const names =
    options.characters.length > 0
      ? options.characters.join(", ")
      : "Use the characters implied by the prompt";

  return [
    "Create an intentionally incorrect quote that feels punchy, funny, and easy to share.",
    "",
    "The writing should sound like a misattributed out-of-context quote, not a full scene.",
    "",
    "## Core Setup",
    options.prompt.trim(),
    "",
    "## Character Framing",
    `- Characters: ${names}`,
    `- Relationship Mode: ${options.relationshipMode}`,
    `- Relationship Guidance: ${RELATIONSHIP_GUIDANCE[options.relationshipMode]}`,
    `- Tone: ${options.tone}`,
    `- Tone Guidance: ${TONE_GUIDANCE[options.tone]}`,
    `- AI model preference: ${options.mode}`,
    "",
    "## Safety Constraints",
    `- noRomance: ${options.safety.noRomance}`,
    `- avoidShipping: ${options.safety.avoidShipping}`,
    `- keepItClean: ${options.safety.keepItClean}`,
    "",
    "## Output Rules",
    `- Output language: ${options.outputLanguage}`,
    `- Length mode: ${options.length}`,
    `- Target length: ${LENGTH_GUIDANCE[options.length]}`,
    "- Keep it short, shareable, and immediately understandable.",
    "- The output must be speaker-labelled so each line clearly shows who is talking.",
    "- Do not add explanation, setup paragraphs, or analysis outside the quote.",
    "- Keep the humor within the requested relationship mode and tone.",
    "",
    "## Required Output Structure",
    "- Return exactly one incorrect quote exchange.",
    "- Use short speaker-labelled lines.",
    "- If needed, include one very short final punchline line.",
  ].join("\n");
}

export function resolveIncorrectQuoteModelConfig(mode: IncorrectQuoteMode): {
  modelName: string;
  temperature: number;
} {
  switch (mode) {
    case "fast":
      return {
        modelName: "gemini-2.5-flash",
        temperature: 0.65,
      };
    case "creative":
      return {
        modelName: "gemini-3-flash",
        temperature: 0.9,
      };
    case "standard":
    default:
      return {
        modelName: "gemini-3.1-flash-lite",
        temperature: 0.75,
      };
  }
}

function escapeTextChunk(content: string): string {
  return content
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

export function createIncorrectQuoteTransformStream() {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let lineBuffer = "";
  let insideThinkTag = false;
  let tagBuffer = "";

  const OPEN_TAG = "<think>";
  const CLOSE_TAG = "</think>";

  const consumeVisibleContent = (content: string) => {
    let visible = "";

    for (const char of content) {
      if (tagBuffer) {
        const candidate = tagBuffer + char;
        const target = insideThinkTag ? CLOSE_TAG : OPEN_TAG;

        if (target.startsWith(candidate)) {
          tagBuffer = candidate;

          if (tagBuffer === target) {
            insideThinkTag = !insideThinkTag;
            tagBuffer = "";
          }

          continue;
        }

        if (!insideThinkTag) {
          visible += candidate;
        }

        tagBuffer = "";
        continue;
      }

      if (char === "<") {
        tagBuffer = "<";
        continue;
      }

      if (!insideThinkTag) {
        visible += char;
      }
    }

    return visible;
  };

  const emitDataLine = (dataLine: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    if (!dataLine.startsWith("data: ")) {
      return;
    }

    const data = dataLine.slice(6);
    if (data === "[DONE]") {
      return;
    }

    try {
      const parsed = JSON.parse(data);
      const rawContent = parsed.choices?.[0]?.delta?.content || "";

      if (!rawContent) {
        return;
      }

      const visible = consumeVisibleContent(rawContent);
      if (!visible) {
        return;
      }

      controller.enqueue(encoder.encode(`0:"${escapeTextChunk(visible)}"\n`));
    } catch {
      // Ignore malformed SSE payloads from upstream.
    }
  };

  return new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      lineBuffer += text;

      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() || "";

      for (const line of lines) {
        emitDataLine(line, controller);
      }
    },

    flush(controller) {
      lineBuffer += decoder.decode();

      if (!lineBuffer.trim()) {
        return;
      }

      emitDataLine(lineBuffer, controller);
    },
  });
}
