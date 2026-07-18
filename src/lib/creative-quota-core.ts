export const CREATIVE_PAGE_KEYS = [
  "story-generator",
  "backstory-generator",
  "bedtime-story-generator",
  "comic-generator",
  "dialogue-generator",
  "dnd-backstory-generator",
  "fanfic-generator",
  "fantasy-generator",
  "incorrect-quote-generator",
  "plot-generator",
  "poem-generator",
  "romance-story-generator",
  "tiktok-comment-generator",
] as const;

export type CreativePageKey = (typeof CREATIVE_PAGE_KEYS)[number];

export type CreativeQuotaStatus = {
  used: number;
  limit: number;
  remaining: number;
  mode: "free" | "credits";
};

export function buildCreativeQuotaKey(
  dateKey: string,
  identity: string,
  pageKey: CreativePageKey
): string {
  return `free-quota:${dateKey}:${identity}:${pageKey}:creative`;
}

export function buildCreativeMergeKey(
  dateKey: string,
  visitorIdentity: string,
  userIdentity: string,
  pageKey: CreativePageKey
): string {
  return `free-quota:${dateKey}:merge:${visitorIdentity}:${userIdentity}:${pageKey}:creative`;
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
  return !hasUser && selectedModel === "creative" && used >= limit;
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

  return `Used today: ${normalizedUsed}/${limit} · Remaining today: ${remaining}/${limit}`;
}

export function getCreativeQuotaLimitReachedMessage(locale: string) {
  if (locale.startsWith("zh")) {
    return "今日 Creative 免费额度已用完，请登录后继续。";
  }

  return "Daily free Creative quota reached. Please sign in to continue.";
}
