export const ACTIVATION_EVENTS = {
  generationStarted: "generation_started",
  generationSucceeded: "generation_succeeded",
  generationFailed: "generation_failed",
  saveDialogOpen: "save_dialog_open",
  storySaved: "story_saved",
  aiWriteFirstGeneration: "ai_write_first_generation",
  activationCompleted: "activation_completed",
} as const;

export type ActivationEvent = (typeof ACTIVATION_EVENTS)[keyof typeof ACTIVATION_EVENTS];

export function getWordCountBucket(wordCount: number) {
  if (wordCount <= 0) return "0";
  if (wordCount < 200) return "1-199";
  if (wordCount < 500) return "200-499";
  if (wordCount < 1000) return "500-999";
  return "1000+";
}

export function buildActivationTrackingPayload({
  sourcePage,
  loggedIn,
  action,
  model,
  wordCount,
}: {
  sourcePage: string;
  loggedIn: boolean;
  action: string;
  model?: string | null;
  wordCount?: number;
}) {
  return {
    source_page: sourcePage,
    logged_in: loggedIn,
    action,
    ...(model ? { model } : {}),
    ...(typeof wordCount === "number"
      ? { word_count_bucket: getWordCountBucket(wordCount) }
      : {}),
  };
}
