import type {
  AuthAction,
  AuthSource,
  AuthSourcePage,
} from "./auth-funnel";

export const AUTH_RESUME_STORAGE_KEY = "auth-funnel:pending-resume";
const AUTH_RESUME_MAX_AGE_MS = 15 * 60 * 1000;

export type PendingAuthResume = {
  source: AuthSource;
  action: AuthAction;
  sourcePage?: AuthSourcePage;
  startedAt: number;
  payload: Record<string, unknown>;
};

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function writePendingAuthResume(resume: PendingAuthResume) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(AUTH_RESUME_STORAGE_KEY, JSON.stringify(resume));
  } catch {
    // Storage can be unavailable or full in restricted browser contexts.
  }
}

export function readPendingAuthResume(): PendingAuthResume | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(AUTH_RESUME_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingAuthResume>;
    if (
      !parsed.source ||
      !parsed.action ||
      typeof parsed.startedAt !== "number" ||
      Date.now() - parsed.startedAt > AUTH_RESUME_MAX_AGE_MS ||
      !parsed.payload ||
      typeof parsed.payload !== "object" ||
      Array.isArray(parsed.payload)
    ) {
      storage.removeItem(AUTH_RESUME_STORAGE_KEY);
      return null;
    }

    return {
      source: parsed.source,
      action: parsed.action,
      ...(parsed.sourcePage ? { sourcePage: parsed.sourcePage } : {}),
      startedAt: parsed.startedAt,
      payload: parsed.payload as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

export function consumePendingAuthResume(
  action: AuthAction,
  options?: { sourcePage?: AuthSourcePage; requireNoSourcePage?: boolean }
) {
  const resume = readPendingAuthResume();
  const matchesSourcePage = options?.requireNoSourcePage
    ? !resume?.sourcePage
    : !options?.sourcePage || resume?.sourcePage === options.sourcePage;

  if (!resume || resume.action !== action || !matchesSourcePage) return null;

  const storage = getStorage();

  if (storage) {
    try {
      storage.removeItem(AUTH_RESUME_STORAGE_KEY);
    } catch {
      // Ignore cleanup failures; the caller consumes the returned value once.
    }
  }

  return resume;
}

export function buildPostAuthResumeTrackingPayload(resume: PendingAuthResume) {
  return {
    source: resume.source,
    action: resume.action,
    ...(resume.sourcePage ? { source_page: resume.sourcePage } : {}),
  };
}
