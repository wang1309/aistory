import type { TiktokCommentRandomPreset } from "@/types/blocks/tiktok-comment-generate";
import type {
  TiktokCommentLength,
  TiktokCommentModelMode,
  TiktokCommentReplyGoal,
  TiktokCommentTone,
} from "@/types/tiktok-comment";

const FALLBACK_RANDOM_PRESETS: Required<TiktokCommentRandomPreset>[] = [
  {
    comment: "This is amazing, where can I learn more?",
    context: "tutorial clip",
    replyGoal: "drive_engagement",
    tone: "warm",
    length: "short",
  },
  {
    comment: "I tried this and it didn't work for me.",
    context: "how-to video",
    replyGoal: "clarify_misunderstanding",
    tone: "empathetic",
    length: "medium",
  },
  {
    comment: "How long does shipping take?",
    context: "product demo",
    replyGoal: "answer_question",
    tone: "professional",
    length: "short",
  },
  {
    comment: "Worst customer service ever.",
    context: "launch recap",
    replyGoal: "handle_negative",
    tone: "empathetic",
    length: "medium",
  },
];

function cleanText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizePreset(
  preset: TiktokCommentRandomPreset
): Required<TiktokCommentRandomPreset> | null {
  const comment = cleanText(preset.comment);

  if (!comment) {
    return null;
  }

  return {
    comment,
    context: cleanText(preset.context),
    replyGoal: (preset.replyGoal ?? "answer_question") as TiktokCommentReplyGoal,
    tone: (preset.tone ?? "warm") as TiktokCommentTone,
    length: (preset.length ?? "short") as TiktokCommentLength,
  };
}

export function pickRandomTiktokCommentPreset({
  presets,
  randomValue = Math.random(),
}: {
  presets: TiktokCommentRandomPreset[];
  randomValue?: number;
}): Required<TiktokCommentRandomPreset> {
  const normalized = presets
    .map(normalizePreset)
    .filter(
      (preset): preset is Required<TiktokCommentRandomPreset> => preset !== null
    );

  const pool = normalized.length > 0 ? normalized : FALLBACK_RANDOM_PRESETS;
  const clampedRandom = Math.min(Math.max(randomValue, 0), 0.999999);
  const index = Math.floor(clampedRandom * pool.length);

  return pool[index];
}

export function splitReplies(output: string): string[] {
  return output
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*\d+[\.)]\s*/, "").trim())
    .filter(Boolean);
}

export type TiktokCommentModelOptions = TiktokCommentModelMode;
