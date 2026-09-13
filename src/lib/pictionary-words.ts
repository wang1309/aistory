export type PictionaryCategory =
  | "animals"
  | "food"
  | "objects"
  | "actions"
  | "places"
  | "fantasy";

export type PictionaryDifficulty = "easy" | "medium" | "hard";

export type PictionaryFilterValue<T extends string> = "all" | T;

export interface PictionaryEntry {
  word: string;
  category: PictionaryCategory | "custom";
  difficulty: PictionaryDifficulty | "any";
}

export interface PictionaryPoolFilter {
  category: PictionaryFilterValue<PictionaryCategory>;
  difficulty: PictionaryFilterValue<PictionaryDifficulty>;
}

/**
 * 180 curated drawing prompts: 6 categories x 3 difficulties x 10 words.
 * Every word is family-friendly and drawable without text or spelling.
 * Content owners: keep ~10 words per (category, difficulty) cell and never
 * duplicate a word — tests/pictionary-words-lib.test.ts enforces both.
 */
const CURATED: Record<
  PictionaryCategory,
  Record<PictionaryDifficulty, string[]>
> = {
  animals: {
    easy: ["Cat", "Dog", "Fish", "Bird", "Horse", "Cow", "Rabbit", "Mouse", "Snake", "Frog"],
    medium: ["Kangaroo", "Penguin", "Dolphin", "Eagle", "Camel", "Octopus", "Owl", "Shark", "Squirrel", "Flamingo"],
    hard: ["Hedgehog", "Jellyfish", "Chameleon", "Armadillo", "Porcupine", "Pelican", "Sloth", "Platypus", "Praying Mantis", "Walrus"],
  },
  food: {
    easy: ["Pizza", "Apple", "Banana", "Cake", "Egg", "Bread", "Ice Cream", "Cheese", "Carrot", "Taco"],
    medium: ["Spaghetti", "Pineapple", "Hamburger", "Pancake", "Popcorn", "Sushi", "Coconut", "Meatball", "Croissant", "Milkshake"],
    hard: ["Dumpling", "Avocado", "Marshmallow", "Pretzel", "Watermelon", "Lasagna", "Omelette", "Lollipop", "Kebab", "Fondue"],
  },
  objects: {
    easy: ["Chair", "Book", "Shoe", "Clock", "Phone", "Key", "Cup", "Hat", "Door", "Lamp"],
    medium: ["Umbrella", "Ladder", "Telescope", "Backpack", "Guitar", "Scissors", "Toothbrush", "Camera", "Wheelbarrow", "Candle"],
    hard: ["Stapler", "Accordion", "Compass", "Hourglass", "Megaphone", "Typewriter", "Tripod", "Abacus", "Periscope", "Windmill"],
  },
  actions: {
    easy: ["Run", "Sleep", "Jump", "Dance", "Swim", "Clap", "Sing", "Cry", "Laugh", "Wave"],
    medium: ["Juggle", "Sneeze", "Climb", "Whisper", "Dig", "Yawn", "March", "Chew", "Skate", "Stretch"],
    hard: ["Meditate", "Negotiate", "Floss", "Levitate", "Photocopy", "Gossip", "Tiptoe", "Stagger", "Pantomime", "Punt"],
  },
  places: {
    easy: ["Beach", "Park", "School", "Farm", "Zoo", "Store", "Castle", "Bridge", "Pool", "Mountain"],
    medium: ["Desert", "Museum", "Airport", "Lighthouse", "Stadium", "Jungle", "Cave", "Library", "Volcano", "Harbor"],
    hard: ["Igloo", "Pyramid", "Aquarium", "Observatory", "Labyrinth", "Vineyard", "Monastery", "Glacier", "Swamp", "Submarine"],
  },
  fantasy: {
    easy: ["Superhero", "Pirate", "Robot", "Wizard", "Dragon", "Princess", "Ghost", "Alien", "Fairy", "Knight"],
    medium: ["Mermaid", "Vampire", "Zombie", "Ninja", "Genie", "Troll", "Unicorn", "Snowman", "Mummy", "Giant"],
    hard: ["Werewolf", "Sphinx", "Kraken", "Phoenix", "Cyclops", "Banshee", "Golem", "Leprechaun", "Minotaur", "Yeti"],
  },
};

export const PICTIONARY_WORDS: PictionaryEntry[] = (
  Object.entries(CURATED) as Array<
    [PictionaryCategory, Record<PictionaryDifficulty, string[]>]
  >
).flatMap(([category, byDifficulty]) =>
  (
    Object.entries(byDifficulty) as Array<[PictionaryDifficulty, string[]]>
  ).flatMap(([difficulty, words]) =>
    words.map((word) => ({ word, category, difficulty }))
  )
);

/**
 * Uniform random integer in [0, maxExclusive) via crypto.getRandomValues with
 * rejection sampling (no modulo bias). Kept local rather than imported from
 * @/lib/nfl-teams so the pictionary tool has no cross-domain data coupling.
 */
function secureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0]!;
  } while (value >= limit);
  return value % maxExclusive;
}

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const a = shuffled[i]!;
    const b = shuffled[j]!;
    shuffled[i] = b;
    shuffled[j] = a;
  }
  return shuffled;
}

export function filterPictionaryWords(
  words: readonly PictionaryEntry[],
  filter: PictionaryPoolFilter
): PictionaryEntry[] {
  return words.filter(
    (entry) =>
      (filter.category === "all" || entry.category === filter.category) &&
      (filter.difficulty === "all" || entry.difficulty === filter.difficulty)
  );
}

/**
 * Draw up to `count` entries, skipping anything in `exclude` (words already
 * drawn this session). Never mutates the pool; returns fewer (possibly zero)
 * entries when the pool is drained.
 */
export function drawPictionaryWords(
  pool: readonly PictionaryEntry[],
  count: number,
  exclude?: ReadonlySet<string>
): PictionaryEntry[] {
  const available = exclude
    ? pool.filter((entry) => !exclude.has(entry.word.toLowerCase()))
    : [...pool];
  return shuffle(available).slice(0, Math.max(0, count));
}

const MAX_CUSTOM_WORDS = 300;
const MAX_CUSTOM_WORD_LENGTH = 60;

export type ParseCustomWordsResult =
  | { ok: true; words: string[] }
  | { ok: false };

/**
 * Parse a pasted custom list: newline / comma / semicolon separated, trimmed,
 * deduplicated case-insensitively, capped at 300 words of <= 60 characters.
 */
export function parseCustomWordList(raw: string): ParseCustomWordsResult {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const chunk of raw.split(/[\n,;]/)) {
    const word = chunk.trim().replace(/\s+/g, " ");
    if (!word) continue;
    if (word.length > MAX_CUSTOM_WORD_LENGTH) return { ok: false };
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
    if (words.length > MAX_CUSTOM_WORDS) return { ok: false };
  }
  if (words.length === 0) return { ok: false };
  return { ok: true, words };
}

/**
 * Merge the curated pool (after filters) with an optional custom list.
 * Custom entries bypass category/difficulty filters — the host chose them.
 */
export function buildPictionaryPool(
  filter: PictionaryPoolFilter,
  customWords?: readonly string[]
): PictionaryEntry[] {
  const curated = filterPictionaryWords(PICTIONARY_WORDS, filter);
  if (!customWords || customWords.length === 0) return curated;
  const custom: PictionaryEntry[] = customWords.map((word) => ({
    word,
    category: "custom",
    difficulty: "any",
  }));
  return [...curated, ...custom];
}
