import type {
  CityGenre,
  CityNicknameGenerateRequest,
  CityNicknameResult,
  CityNicknameStyle,
  CityTone,
  NormalizedCityNicknameRequest,
} from "@/types/city-nickname";

const GENRES: readonly CityGenre[] = [
  "fantasy",
  "dark-fantasy",
  "noir",
  "cyberpunk",
  "sci-fi",
  "steampunk",
  "modern",
  "post-apocalyptic",
];

const TONES: readonly CityTone[] = [
  "poetic",
  "majestic",
  "gritty",
  "ominous",
  "romantic",
  "cold",
  "street",
];

const STYLES: readonly CityNicknameStyle[] = [
  "official",
  "local",
  "legendary",
  "mocking",
];

const COUNTS = new Set([6, 12, 20]);

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizeAllowed<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

export function normalizeCityNicknameRequest(
  input: CityNicknameGenerateRequest & { locale?: string }
): NormalizedCityNicknameRequest {
  const nicknameStyles = Array.isArray(input.nicknameStyles)
    ? input.nicknameStyles.filter((item): item is CityNicknameStyle =>
        STYLES.includes(item as CityNicknameStyle)
      )
    : [];

  const count = COUNTS.has(Number(input.count))
    ? (Number(input.count) as 6 | 12 | 20)
    : 12;

  return {
    cityName: clean(input.cityName),
    cityType: clean(input.cityType),
    genre: normalizeAllowed(input.genre, GENRES, "fantasy"),
    reputation: clean(input.reputation),
    tone: normalizeAllowed(input.tone, TONES, "majestic"),
    knownFor: clean(input.knownFor),
    geography: clean(input.geography),
    powerOrCulture: clean(input.powerOrCulture),
    nicknameStyles: nicknameStyles.length ? nicknameStyles : ["official"],
    count,
    locale: clean(input.locale) || "en",
  };
}

export function buildCityNicknamePrompt(
  input: NormalizedCityNicknameRequest
): string {
  return [
    "You generate nickname ideas for fictional cities used in stories, RPGs, and worldbuilding.",
    "Return valid JSON only. JSON only, no prose before or after.",
    `City name: ${input.cityName || "not provided"}`,
    `City type: ${input.cityType}`,
    `Genre: ${input.genre}`,
    `Reputation: ${input.reputation}`,
    `Tone: ${input.tone}`,
    `Known for: ${input.knownFor}`,
    `Geography: ${input.geography || "not specified"}`,
    `Power or culture: ${input.powerOrCulture || "not specified"}`,
    `Requested styles: ${input.nicknameStyles.join(", ")}`,
    `Count: ${input.count}`,
    "Generate concise city nicknames with distinct social viewpoints.",
    "Required fields for each result: nickname, style, vibe, whyItFits, bestFor.",
    "Supported styles: official, local, legendary, mocking.",
    "Keep nicknames to 2-5 words when possible.",
    "Avoid repetitive templates and generic filler.",
    'Output shape: {"results":[{"nickname":"","style":"","vibe":"","whyItFits":"","bestFor":""}]}',
  ].join("\n");
}

export function parseCityNicknameResponse(raw: string): CityNicknameResult[] {
  const match = raw.match(/```json\s*([\s\S]*?)```/i);
  const jsonText = match?.[1] ?? raw;
  const parsed = JSON.parse(jsonText) as { results?: CityNicknameResult[] };
  if (!Array.isArray(parsed.results)) {
    throw new Error("Invalid city nickname response");
  }
  return parsed.results;
}

export function groupCityNicknameResults(results: CityNicknameResult[]) {
  return {
    official: results.filter((item) => item.style === "official"),
    local: results.filter((item) => item.style === "local"),
    legendary: results.filter((item) => item.style === "legendary"),
    mocking: results.filter((item) => item.style === "mocking"),
  };
}

export async function generateCityNicknames(
  input: NormalizedCityNicknameRequest
) {
  const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GRSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gemini-3.1-flash-lite",
      stream: false,
      temperature: 0.9,
      messages: [
        {
          role: "user",
          content: buildCityNicknamePrompt(input),
        },
      ],
    }),
  });

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content ?? "";
  const results = parseCityNicknameResponse(content);

  return {
    results,
    grouped: groupCityNicknameResults(results),
    meta: {
      cityType: input.cityType,
      genre: input.genre,
      tone: input.tone,
      count: results.length,
    },
  };
}
