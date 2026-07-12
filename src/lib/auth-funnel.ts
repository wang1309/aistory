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

export type AuthSourcePage =
  | "ai-write"
  | "story-generator"
  | "backstory-generator"
  | "fanfic-generator"
  | "dialogue-generator"
  | "dnd-backstory-generator"
  | "plot-generator"
  | "poem-generator"
  | "fantasy-generator";

export const AUTH_ATTEMPT_STORAGE_KEY = "auth-funnel:pending-attempt";

export type PendingAuthAttempt = {
  source: AuthSource;
  action: AuthAction;
  provider: AuthProvider;
  sourcePage?: AuthSourcePage;
  startedAt: number;
};

export type AuthIntent = {
  source: AuthSource;
  action: AuthAction;
  sourcePage?: AuthSourcePage;
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
    ...(input.sourcePage ? { sourcePage: input.sourcePage } : {}),
    ...(input.redirectTo ? { redirectTo: input.redirectTo } : {}),
    ...(input.context ? { context: input.context } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };
}

export function buildAuthTrackingPayload(
  intent: Pick<AuthIntent, "source" | "action" | "context"> & {
    sourcePage?: AuthSourcePage;
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
    ...(intent.sourcePage ? { source_page: intent.sourcePage } : {}),
    ...(intent.provider ? { provider: intent.provider } : {}),
    ...(context ? { context } : {}),
    ...(intent.locale ? { locale: intent.locale } : {}),
    ...(intent.reason ? { reason: intent.reason } : {}),
  };
}

export function writePendingAuthAttempt(attempt: PendingAuthAttempt) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      AUTH_ATTEMPT_STORAGE_KEY,
      JSON.stringify(attempt)
    );
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function readPendingAuthAttempt(): PendingAuthAttempt | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(AUTH_ATTEMPT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingAuthAttempt>;
    if (
      !parsed.source ||
      !parsed.action ||
      !parsed.provider ||
      typeof parsed.startedAt !== "number" ||
      Date.now() - parsed.startedAt > 15 * 60 * 1000
    ) {
      return null;
    }

    return {
      source: parsed.source,
      action: parsed.action,
      provider: parsed.provider,
      ...(parsed.sourcePage ? { sourcePage: parsed.sourcePage } : {}),
      startedAt: parsed.startedAt,
    } as PendingAuthAttempt;
  } catch {
    return null;
  }
}

export function clearPendingAuthAttempt() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(AUTH_ATTEMPT_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}
