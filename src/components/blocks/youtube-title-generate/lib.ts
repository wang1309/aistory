import type {
  GeneratedYoutubeTitle,
  YoutubeTitleAngle,
} from "@/types/youtube-title";
import type { YoutubeTitleRandomPreset } from "@/types/blocks/youtube-title-generate";

const STORAGE_KEY = "youtube-title-generator:shortlist";
const HISTORY_KEY = "youtube-title-generator:history";

const FALLBACK_RANDOM_PRESETS: Required<YoutubeTitleRandomPreset>[] = [
  {
    videoTopic: "How I edit long-form YouTube videos faster",
    targetAudience: "Solo creators editing their own videos",
    summary: "A workflow walkthrough showing how to cut a 30-minute vlog in under two hours.",
    titleLengthPreference: "medium",
    optimizationPreference: "balanced",
    avoidWords: ["insane", "secret"],
  },
  {
    videoTopic: "Beginner home workout with no equipment",
    targetAudience: "Busy people new to fitness",
    summary: "A 20-minute routine filmed in a small apartment with clear modifications.",
    titleLengthPreference: "short",
    optimizationPreference: "clicks",
    avoidWords: [],
  },
  {
    videoTopic: "Reviewing every budget mechanical keyboard I bought this year",
    targetAudience: "Typists and gamers on a budget",
    summary: "Twelve keyboards tested over six months with sound and typing feel notes.",
    titleLengthPreference: "flexible",
    optimizationPreference: "search",
    avoidWords: ["crazy"],
  },
];

export const ANGLE_GROUPS: { key: YoutubeTitleAngle; labelKey: string }[] = [
  { key: "search-first", labelKey: "ui.angle_search" },
  { key: "curiosity-first", labelKey: "ui.angle_curiosity" },
  { key: "outcome-first", labelKey: "ui.angle_outcome" },
  { key: "contrarian-first", labelKey: "ui.angle_contrarian" },
];

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizePreset(
  preset: YoutubeTitleRandomPreset
): Required<YoutubeTitleRandomPreset> | null {
  const videoTopic = clean(preset.videoTopic);
  if (!videoTopic) return null;

  return {
    videoTopic,
    targetAudience: clean(preset.targetAudience),
    summary: clean(preset.summary),
    titleLengthPreference: preset.titleLengthPreference ?? "medium",
    optimizationPreference: preset.optimizationPreference ?? "balanced",
    avoidWords: Array.isArray(preset.avoidWords)
      ? preset.avoidWords.map((v) => v.trim()).filter(Boolean)
      : [],
  };
}

export function pickRandomYoutubeTitlePreset({
  presets,
  randomValue = Math.random(),
}: {
  presets: YoutubeTitleRandomPreset[];
  randomValue?: number;
}): Required<YoutubeTitleRandomPreset> {
  const normalized = presets
    .map(normalizePreset)
    .filter((p): p is Required<YoutubeTitleRandomPreset> => p !== null);

  const pool = normalized.length > 0 ? normalized : FALLBACK_RANDOM_PRESETS;
  const clampedRandom = Math.min(Math.max(randomValue, 0), 0.999999);
  return pool[Math.floor(clampedRandom * pool.length)];
}

export function saveShortlist(items: GeneratedYoutubeTitle[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, 3))
    );
  } catch {
    // ignore persistence errors
  }
}

export function loadShortlist(): GeneratedYoutubeTitle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GeneratedYoutubeTitle[]) : [];
  } catch {
    return [];
  }
}

export function clearShortlist() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

interface PersistedHistoryItem {
  id: string;
  createdAt: string;
  videoTopic: string;
  targetAudience: string;
  summary: string;
  titleLengthPreference: string;
  optimizationPreference: string;
  avoidWords: string[];
  output: GeneratedYoutubeTitle[];
  recommendedTitle: string;
  recommendedReason: string;
  backupTitle: string;
}

export function getHistory(): PersistedHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PersistedHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: PersistedHistoryItem) {
  if (typeof window === "undefined") return;
  const history = getHistory();
  const next = [entry, ...history].slice(0, 8);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore persistence errors
  }
}

export function deleteHistoryEntry(id: string) {
  if (typeof window === "undefined") return;
  const next = getHistory().filter((item) => item.id !== id);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore persistence errors
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HISTORY_KEY);
}

export type { PersistedHistoryItem };
