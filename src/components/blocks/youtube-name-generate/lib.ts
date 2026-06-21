import type { YoutubeNameRandomPreset } from "@/types/blocks/youtube-name-generate";
import type {
  YoutubeNameLengthPreference,
  YoutubeNamePivotFlexibility,
  YoutubeNameStyle,
} from "@/types/youtube-name";
import type { GeneratedYoutubeName } from "@/types/youtube-name";

const FALLBACK_RANDOM_PRESETS: Required<YoutubeNameRandomPreset>[] = [
  {
    niche: "Solo roguelike gaming with daily challenges",
    audience: "Teens and young adults who like fast-paced indie games",
    style: "brandable",
    lengthPreference: "short",
    pivotFlexibility: "medium",
    keywords: ["rogue", "run"],
    creatorName: "",
  },
  {
    niche: "Beginner-friendly cooking for small apartments",
    audience: "Busy young professionals who want simple recipes",
    style: "searchable",
    lengthPreference: "flexible",
    pivotFlexibility: "low",
    keywords: ["easy", "kitchen"],
    creatorName: "",
  },
  {
    niche: "Slow-living vlogs from the Pacific Northwest",
    audience: "People in their late 20s seeking calm and routine",
    style: "cinematic",
    lengthPreference: "medium",
    pivotFlexibility: "high",
    keywords: ["woods", "quiet"],
    creatorName: "Mara",
  },
];

function cleanText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizePreset(
  preset: YoutubeNameRandomPreset
): Required<YoutubeNameRandomPreset> | null {
  const niche = cleanText(preset.niche);
  if (!niche) return null;

  return {
    niche,
    audience: cleanText(preset.audience),
    style: (preset.style ?? "hybrid") as YoutubeNameStyle,
    lengthPreference: (preset.lengthPreference ?? "short") as YoutubeNameLengthPreference,
    pivotFlexibility: (preset.pivotFlexibility ?? "medium") as YoutubeNamePivotFlexibility,
    keywords: Array.isArray(preset.keywords)
      ? preset.keywords.map((v) => v.trim()).filter(Boolean)
      : [],
    creatorName: cleanText(preset.creatorName),
  };
}

export function pickRandomYoutubeNamePreset({
  presets,
  randomValue = Math.random(),
}: {
  presets: YoutubeNameRandomPreset[];
  randomValue?: number;
}): Required<YoutubeNameRandomPreset> {
  const normalized = presets
    .map(normalizePreset)
    .filter((p): p is Required<YoutubeNameRandomPreset> => p !== null);

  const pool = normalized.length > 0 ? normalized : FALLBACK_RANDOM_PRESETS;
  const clampedRandom = Math.min(Math.max(randomValue, 0), 0.999999);
  return pool[Math.floor(clampedRandom * pool.length)];
}

export function overallScore(scores: GeneratedYoutubeName["scores"]): number {
  return (
    scores.memorability +
    scores.pronounceability +
    scores.uniqueness +
    scores.pivotFlexibility
  );
}

export function sortNamesByScore(names: GeneratedYoutubeName[]): GeneratedYoutubeName[] {
  return [...names].sort((a, b) => overallScore(b.scores) - overallScore(a.scores));
}
