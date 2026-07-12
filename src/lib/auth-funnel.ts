export type AuthSource =
  | "header"
  | "story_save"
  | "story_like"
  | "story_comment"
  | "ai_write"
  | "paywall"
  | "pricing";

export type AuthAction =
  | "sign_in"
  | "save_story"
  | "like_story"
  | "comment_story"
  | "continue_writing"
  | "checkout";

export type AuthProvider = "google" | "github" | "google-one-tap";

export type AuthIntent = {
  source: AuthSource;
  action: AuthAction;
  redirectTo?: string;
  context?: string;
  metadata?: Record<string, unknown>;
};

export type AuthIntentInput = Partial<Pick<AuthIntent, "action">> &
  Pick<AuthIntent, "source"> &
  Omit<AuthIntent, "source" | "action">;

export function normalizeAuthIntent(input: AuthIntentInput): AuthIntent {
  return {
    source: input.source,
    action: input.action || "sign_in",
    ...(input.redirectTo ? { redirectTo: input.redirectTo } : {}),
    ...(input.context ? { context: input.context } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };
}

export function buildAuthTrackingPayload(
  intent: Pick<AuthIntent, "source" | "action" | "context"> & {
    provider?: AuthProvider;
    locale?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const metadataContext = intent.metadata?.context;
  const context =
    intent.context ||
    (typeof metadataContext === "string" ? metadataContext : undefined);

  return {
    source: intent.source,
    action: intent.action,
    ...(intent.provider ? { provider: intent.provider } : {}),
    ...(context ? { context } : {}),
    ...(intent.locale ? { locale: intent.locale } : {}),
    ...(intent.reason ? { reason: intent.reason } : {}),
  };
}
