import type { CreativePageKey } from "@/lib/creative-quota-core";

export type GenreStoryKind = "horror" | "mystery" | "sci_fi" | "adventure";

export type GenreStoryOptionValues = Record<string, readonly string[]>;

export interface GenreStoryGenerator {
  /** Route slug, also used as the creative-quota page key. */
  slug: string;
  /** Locale-agnostic public path. */
  href: string;
  pageKey: CreativePageKey;
  icon: string;
  genre: GenreStoryKind;
  /** Directory under src/i18n/pages. */
  i18nNamespace: string;
  /** Root key inside the locale JSON file. */
  messageKey: string;
  /** Allowed genre-specific option keys, in render order. */
  optionKeys: readonly string[];
  /** Allowed values for every genre-specific option key. */
  optionValues: GenreStoryOptionValues;
  /** Default value for every genre-specific option key. */
  defaultOptions: Record<string, string>;
  /** Allowed output lengths, in render order. */
  lengths: readonly string[];
  defaultLength: string;
}

export const GENRE_STORY_GENERATORS: readonly GenreStoryGenerator[] = [
  {
    slug: "horror-story-generator",
    href: "/horror-story-generator",
    pageKey: "horror-story-generator",
    icon: "RiMoonLine",
    genre: "horror",
    i18nNamespace: "horror-story-generate",
    messageKey: "horror_story_generate",
    optionKeys: ["horrorMode", "scareIntensity", "endingType"],
    optionValues: {
      horrorMode: ["horror", "spooky", "psychological", "supernatural"],
      scareIntensity: ["low", "medium", "high"],
      endingType: ["twist", "tragic", "ambiguous", "hopeful"],
    },
    defaultOptions: {
      horrorMode: "horror",
      scareIntensity: "medium",
      endingType: "twist",
    },
    lengths: ["two_sentence", "short", "full"],
    defaultLength: "short",
  },
  {
    slug: "mystery-story-generator",
    href: "/mystery-story-generator",
    pageKey: "mystery-story-generator",
    icon: "RiSearchLine",
    genre: "mystery",
    i18nNamespace: "mystery-story-generate",
    messageKey: "mystery_story_generate",
    optionKeys: ["subgenre", "mysteryIntensity", "includeTwist"],
    optionValues: {
      subgenre: ["murder", "cozy", "locked_room", "detective", "noir", "psychological"],
      mysteryIntensity: ["low", "medium", "high"],
      includeTwist: ["yes", "no"],
    },
    defaultOptions: {
      subgenre: "murder",
      mysteryIntensity: "medium",
      includeTwist: "yes",
    },
    lengths: ["hook", "short", "full_outline"],
    defaultLength: "short",
  },
  {
    slug: "sci-fi-story-generator",
    href: "/sci-fi-story-generator",
    pageKey: "sci-fi-story-generator",
    icon: "RiRocketLine",
    genre: "sci_fi",
    i18nNamespace: "sci-fi-story-generate",
    messageKey: "sci_fi_story_generate",
    optionKeys: ["sciFiSubgenre", "scienceMode", "includeTwist"],
    optionValues: {
      sciFiSubgenre: [
        "hard_sf",
        "space_opera",
        "cyberpunk",
        "dystopian",
        "time_travel",
        "first_contact",
        "ai_uprising",
        "post_apocalyptic",
      ],
      scienceMode: ["hard_sf", "space_opera"],
      includeTwist: ["yes", "no"],
    },
    defaultOptions: {
      sciFiSubgenre: "hard_sf",
      scienceMode: "hard_sf",
      includeTwist: "yes",
    },
    lengths: ["hook", "short", "full_outline"],
    defaultLength: "short",
  },
  {
    slug: "adventure-story-generator",
    href: "/adventure-story-generator",
    pageKey: "adventure-story-generator",
    icon: "RiRouteLine",
    genre: "adventure",
    i18nNamespace: "adventure-story-generate",
    messageKey: "adventure_story_generate",
    optionKeys: ["adventureSetting"],
    optionValues: {
      adventureSetting: [
        "pirate",
        "lost_world",
        "space",
        "fantasy_kingdom",
        "survival",
        "mystery_quest",
      ],
    },
    defaultOptions: {
      adventureSetting: "pirate",
    },
    lengths: ["hook", "short", "full_outline", "branching_path"],
    defaultLength: "short",
  },
] as const;

export const GENRE_STORY_GENERATOR_SLUGS = GENRE_STORY_GENERATORS.map(
  (generator) => generator.slug
);

export function getGenreStoryGenerator(
  slug: string
): GenreStoryGenerator | undefined {
  return GENRE_STORY_GENERATORS.find((generator) => generator.slug === slug);
}

export function getGenreStoryGeneratorByGenre(
  genre: string
): GenreStoryGenerator | undefined {
  return GENRE_STORY_GENERATORS.find((generator) => generator.genre === genre);
}

export const GENRE_STORY_COMMON_OPTION_VALUES = {
  tone: ["dark", "suspenseful", "hopeful", "neutral", "whimsical"],
  perspective: ["first_person", "third_person_limited", "omniscient"],
  audience: ["young_adult", "adult", "all_ages"],
} as const;

export const GENRE_STORY_COMMON_OPTION_DEFAULTS = {
  tone: "neutral",
  perspective: "third_person_limited",
  audience: "adult",
} as const;

export function isGenreStoryKind(value: string): value is GenreStoryKind {
  return GENRE_STORY_GENERATORS.some((generator) => generator.genre === value);
}

/**
 * Human-readable English labels used inside the model prompt. The visible UI
 * labels come from the locale JSON, so this map never leaks into the page.
 */
export const GENRE_STORY_OPTION_PROMPT_LABELS: Record<
  string,
  Record<string, string>
> = {
  horrorMode: {
    horror: "Horror",
    spooky: "Spooky / Halloween",
    psychological: "Psychological horror",
    supernatural: "Supernatural horror",
  },
  scareIntensity: {
    low: "Low intensity",
    medium: "Medium intensity",
    high: "High intensity",
  },
  endingType: {
    twist: "Twist ending",
    tragic: "Tragic ending",
    ambiguous: "Ambiguous ending",
    hopeful: "Hopeful ending",
  },
  subgenre: {
    murder: "Murder mystery",
    cozy: "Cozy mystery",
    locked_room: "Locked-room mystery",
    detective: "Detective story",
    noir: "Noir",
    psychological: "Psychological mystery",
  },
  mysteryIntensity: {
    low: "Low intensity",
    medium: "Medium intensity",
    high: "High intensity",
  },
  includeTwist: {
    yes: "Include a twist",
    no: "No forced twist",
  },
  sciFiSubgenre: {
    hard_sf: "Hard science fiction",
    space_opera: "Space opera",
    cyberpunk: "Cyberpunk",
    dystopian: "Dystopian",
    time_travel: "Time travel",
    first_contact: "First contact",
    ai_uprising: "AI uprising",
    post_apocalyptic: "Post-apocalyptic",
  },
  scienceMode: {
    hard_sf: "Hard SF rules: keep the science plausible",
    space_opera: "Space opera: prioritize scale and adventure",
  },
  adventureSetting: {
    pirate: "Pirate seas",
    lost_world: "Lost world / ancient ruins",
    space: "Space frontier",
    fantasy_kingdom: "Fantasy kingdom",
    survival: "Survival wilderness",
    mystery_quest: "Mystery quest",
  },
  tone: {
    dark: "Dark",
    suspenseful: "Suspenseful",
    hopeful: "Hopeful",
    neutral: "Balanced",
    whimsical: "Whimsical",
  },
  perspective: {
    first_person: "First person",
    third_person_limited: "Third person limited",
    omniscient: "Omniscient",
  },
  audience: {
    young_adult: "Young adult",
    adult: "Adult",
    all_ages: "All ages",
  },
};

export function getGenreStoryOptionPromptLabel(
  key: string,
  value: string
): string {
  return GENRE_STORY_OPTION_PROMPT_LABELS[key]?.[value] ?? value;
}
