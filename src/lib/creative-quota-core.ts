export const CREATIVE_PAGE_KEYS = [
  "story-generator",
  "backstory-generator",
  "band-name-generator",
  "bedtime-story-generator",
  "comic-generator",
  "dialogue-generator",
  "dnd-backstory-generator",
  "elf-name-generator",
  "fanfic-generator",
  "fantasy-generator",
  "gang-name-generator",
  "incorrect-quote-generator",
  "literature-review-generator",
  "middle-name-generator",
  "plot-generator",
  "poem-generator",
  "pen-name-generator",
  "romance-story-generator",
  "tiktok-comment-generator",
  "oc-generator",
  "story-summarizer",
  "story-prompt-generator",
  "essay-extender",
  "paragraph-rewriter",
  "ai-humanizer",
  "rap-lyric-generator",
] as const;

export type CreativePageKey = (typeof CREATIVE_PAGE_KEYS)[number];

/** Model tiers that consume a daily free quota. `fast` is unlimited. */
export const QUOTA_TIERS = ["standard", "creative"] as const;

export type QuotaTier = (typeof QUOTA_TIERS)[number];

export function isQuotaTier(
  model: string | null | undefined
): model is QuotaTier {
  return model === "standard" || model === "creative";
}

/**
 * Resolve the quota tier for a requested model.
 *
 * - fast / empty => null (unlimited)
 * - creative => creative
 * - standard / unknown => standard (fail closed: unknown values fall back to
 *   the standard model in every quota-enabled route, so they must be counted)
 */
export function resolveQuotaTier(
  model?: string | null
): QuotaTier | null {
  const value = (model || "").trim().toLowerCase();
  if (!value || value === "fast") return null;
  return value === "creative" ? "creative" : "standard";
}

export type CreativeQuotaStatus = {
  used: number;
  limit: number;
  remaining: number;
  mode: "free" | "credits";
};

export type CreativeQuotaClientStatus = CreativeQuotaStatus & {
  creditCost: number;
  leftCredits?: number;
};

export function buildQuotaKey(
  dateKey: string,
  identity: string,
  pageKey: CreativePageKey,
  tier: QuotaTier
): string {
  return `free-quota:${dateKey}:${identity}:${pageKey}:${tier}`;
}

export function buildCreativeQuotaKey(
  dateKey: string,
  identity: string,
  pageKey: CreativePageKey
): string {
  return buildQuotaKey(dateKey, identity, pageKey, "creative");
}

export function buildQuotaMergeKey(
  dateKey: string,
  visitorIdentity: string,
  userIdentity: string,
  pageKey: CreativePageKey,
  tier: QuotaTier
): string {
  return `free-quota:${dateKey}:merge:${visitorIdentity}:${userIdentity}:${pageKey}:${tier}`;
}

export function buildCreativeMergeKey(
  dateKey: string,
  visitorIdentity: string,
  userIdentity: string,
  pageKey: CreativePageKey
): string {
  return buildQuotaMergeKey(
    dateKey,
    visitorIdentity,
    userIdentity,
    pageKey,
    "creative"
  );
}

export function buildLegacyCreativeQuotaKey(dateKey: string, identity: string): string {
  return `free-quota:${dateKey}:${identity}:creative`;
}

export function buildCreativeMigrationKey(dateKey: string, identity: string): string {
  return `free-quota:${dateKey}:migration:${identity}:story-generator:creative`;
}

export function migrateCreativeUsedCount(
  legacyUsed: number,
  currentUsed: number,
  limit: number
): number {
  return Math.min(limit, Math.max(0, legacyUsed, currentUsed));
}

export function incrementCreativeUsedCount(used: number, limit: number): number {
  return Math.min(limit, Math.max(0, used) + 1);
}

export function mergeUsedCounts(
  accountUsed: number,
  visitorUsed: number,
  limit: number
): number {
  return Math.min(limit, Math.max(0, accountUsed) + Math.max(0, visitorUsed));
}

export function getCreativeQuotaStatus(
  used: number,
  limit: number
): CreativeQuotaStatus {
  const normalizedUsed = Math.max(0, used);
  return {
    used: normalizedUsed,
    limit,
    remaining: Math.max(0, limit - normalizedUsed),
    mode: normalizedUsed < limit ? "free" : "credits",
  };
}

export function shouldOptimisticallyGateCreativeAnonymousUsage({
  hasUser,
  selectedModel,
  used,
  limit,
}: {
  hasUser: boolean;
  selectedModel: string | null | undefined;
  used: number;
  limit: number;
}) {
  return !hasUser && isQuotaTier(selectedModel) && used >= limit;
}

export function shouldOptimisticallyGateCreativeCreditUsage({
  hasUser,
  selectedModel,
  used,
  limit,
  credits,
  cost,
}: {
  hasUser: boolean;
  selectedModel: string | null | undefined;
  used: number;
  limit: number;
  credits: number | null;
  cost: number | null;
}) {
  return (
    hasUser &&
    isQuotaTier(selectedModel) &&
    used >= limit &&
    credits !== null &&
    cost !== null &&
    credits < cost
  );
}

export function buildCreativeQuotaClientStatus({
  quota,
  creditCost,
  leftCredits,
}: {
  quota: CreativeQuotaStatus;
  creditCost: number;
  leftCredits: number | null;
}): CreativeQuotaClientStatus {
  return {
    ...quota,
    creditCost,
    ...(leftCredits === null ? {} : { leftCredits }),
  };
}

export function formatCreativeQuotaHint({
  locale,
  used,
  limit,
}: {
  locale: string;
  used: number;
  limit: number;
}) {
  const normalizedUsed = Math.min(limit, Math.max(0, used));
  const remaining = Math.max(0, limit - normalizedUsed);

  if (locale.startsWith("zh")) {
    return `今日已用：${normalizedUsed}/${limit} · 今日剩余：${remaining}/${limit}`;
  }
  if (locale.startsWith("de")) {
    return `Heute verwendet: ${normalizedUsed}/${limit} · Heute übrig: ${remaining}/${limit}`;
  }
  if (locale.startsWith("ko")) {
    return `오늘 사용: ${normalizedUsed}/${limit} · 오늘 남음: ${remaining}/${limit}`;
  }
  if (locale.startsWith("ja")) {
    return `本日の使用: ${normalizedUsed}/${limit} · 本日の残り: ${remaining}/${limit}`;
  }
  if (locale.startsWith("ru")) {
    return `Использовано сегодня: ${normalizedUsed}/${limit} · Осталось сегодня: ${remaining}/${limit}`;
  }

  return `Used today: ${normalizedUsed}/${limit} · Remaining today: ${remaining}/${limit}`;
}

export function getCreativeQuotaLimitReachedMessage(locale: string) {
  if (locale.startsWith("zh")) {
    return "今日免费额度已用完，请登录后继续。";
  }
  if (locale.startsWith("de")) {
    return "Tageslimit erreicht. Bitte melde dich an, um fortzufahren.";
  }
  if (locale.startsWith("ko")) {
    return "오늘의 무료 사용량을 모두 사용했습니다. 계속하려면 로그인하세요.";
  }
  if (locale.startsWith("ja")) {
    return "本日の無料利用回数を使い切りました。続けるにはサインインしてください。";
  }
  if (locale.startsWith("ru")) {
    return "Дневной бесплатный лимит исчерпан. Войдите, чтобы продолжить.";
  }

  return "Daily free quota reached. Please sign in to continue.";
}
