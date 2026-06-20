import type {
  NormalizedTiktokCommentRequest,
  TiktokCommentGenerateRequest,
  TiktokCommentLength,
  TiktokCommentModelMode,
  TiktokCommentPromptOptions,
  TiktokCommentReplyGoal,
  TiktokCommentTone,
} from "@/types/tiktok-comment";

const REPLY_GOALS: readonly TiktokCommentReplyGoal[] = [
  "thank_you",
  "answer_question",
  "clarify_misunderstanding",
  "drive_engagement",
  "handle_negative",
];

const TONES: readonly TiktokCommentTone[] = [
  "warm",
  "professional",
  "funny",
  "sales",
  "empathetic",
];

const LENGTHS: readonly TiktokCommentLength[] = ["short", "medium", "long"];

const MODES: readonly TiktokCommentModelMode[] = [
  "fast",
  "standard",
  "creative",
];

const LENGTH_GUIDANCE: Record<TiktokCommentLength, string> = {
  short: "1-2 short sentences",
  medium: "2-3 short sentences",
  long: "3-4 short sentences",
};

const REPLY_GOAL_GUIDANCE: Record<TiktokCommentReplyGoal, string> = {
  thank_you: "Thank the commenter genuinely and make them feel seen.",
  answer_question:
    "Answer the question clearly and concisely, with a helpful pointer if useful.",
  clarify_misunderstanding:
    "Politely correct the misunderstanding without being defensive.",
  drive_engagement:
    "Invite the commenter to respond, share, or check out the linked content.",
  handle_negative:
    "Acknowledge the concern, stay calm, and offer a constructive path forward.",
};

const TONE_GUIDANCE: Record<TiktokCommentTone, string> = {
  warm: "Friendly, supportive, and human — like a community manager who actually cares.",
  professional:
    "Polished and brand-safe, but still human and not corporate or stiff.",
  funny: "Light and witty without forcing a joke or going viral bait.",
  sales:
    "Gentle promotion that nudges toward action without overselling.",
  empathetic:
    "Validate the feeling first, then offer comfort or support.",
};

const DEFAULTS = {
  locale: "en",
  outputLanguage: "en",
  replyGoal: "answer_question" as TiktokCommentReplyGoal,
  tone: "warm" as TiktokCommentTone,
  length: "short" as TiktokCommentLength,
  mode: "standard" as TiktokCommentModelMode,
};

function cleanText(value: string | undefined): string {
  return value?.trim() ?? "";
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

export function normalizeTiktokCommentRequest(
  input: TiktokCommentGenerateRequest
): NormalizedTiktokCommentRequest {
  const comment = cleanText(input.comment);
  const context = cleanText(input.context);
  const locale = cleanText(input.locale) || DEFAULTS.locale;
  const outputLanguage =
    cleanText(input.outputLanguage) || DEFAULTS.outputLanguage;
  const replyGoal = normalizeAllowedOption(
    input.replyGoal,
    REPLY_GOALS,
    DEFAULTS.replyGoal
  );
  const tone = normalizeAllowedOption(input.tone, TONES, DEFAULTS.tone);
  const length = normalizeAllowedOption(input.length, LENGTHS, DEFAULTS.length);
  const mode = normalizeAllowedOption(input.mode, MODES, DEFAULTS.mode);

  return {
    comment,
    context,
    replyGoal,
    tone,
    length,
    outputLanguage,
    mode,
    locale,
  };
}

function humanizeKey(value: string): string {
  return value
    .split("_")
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function buildTiktokCommentPrompt(
  options: TiktokCommentPromptOptions
): string {
  const lines: string[] = [
    "You write replies for a TikTok creator or community manager. The input may be a TikTok comment OR the caption/description of a TikTok video. Turn it into 3-5 copy-ready replies that feel human, not robotic. If the input is a video (not a comment from another user), treat the output as engaging top-level comments that a creator would post on that video.",
    "",
    "## Source Input (comment or video)",
    options.comment.trim(),
    "",
    "## Context (optional)",
    options.context.trim() || "No extra context provided.",
    "",
    "## Reply Goal",
    `- Goal: ${humanizeKey(options.replyGoal)}`,
    `- Guidance: ${REPLY_GOAL_GUIDANCE[options.replyGoal]}`,
    "",
    "## Tone",
    `- Tone: ${humanizeKey(options.tone)}`,
    `- Tone Guidance: ${TONE_GUIDANCE[options.tone]}`,
    "",
    "## Output Rules",
    `- Output language: ${options.outputLanguage}`,
    `- Length: ${LENGTH_GUIDANCE[options.length]} per reply.`,
    "- Write each reply like a real creator or community manager would actually type it.",
    "- No spammy, robotic, or oversell language. No emoji overkill. No hashtags unless they fit the moment.",
    "- Keep every reply distinct — vary opening words, structure, and angle.",
    "- Each reply on its own line, prefixed with the number, like \"1. ...\".",
    "- Do not include analysis, explanations, or extra commentary outside the replies.",
    "- Stay on topic and aligned with the reply goal.",
  ];

  return lines.join("\n");
}

export function resolveTiktokCommentModelConfig(mode: TiktokCommentModelMode): {
  modelName: string;
  temperature: number;
} {
  switch (mode) {
    case "fast":
      return {
        modelName: "gemini-2.5-flash",
        temperature: 0.7,
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

export function createTiktokCommentTransformStream() {
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

  const emitDataLine = (
    dataLine: string,
    controller: TransformStreamDefaultController<Uint8Array>
  ) => {
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

      controller.enqueue(
        encoder.encode(`0:"${escapeTextChunk(visible)}"\n`)
      );
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
