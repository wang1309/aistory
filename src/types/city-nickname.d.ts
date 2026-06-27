export type CityNicknameStyle =
  | "official"
  | "local"
  | "legendary"
  | "mocking";

export type CityGenre =
  | "fantasy"
  | "dark-fantasy"
  | "noir"
  | "cyberpunk"
  | "sci-fi"
  | "steampunk"
  | "modern"
  | "post-apocalyptic";

export type CityTone =
  | "poetic"
  | "majestic"
  | "gritty"
  | "ominous"
  | "romantic"
  | "cold"
  | "street";

export interface CityNicknameGenerateRequest {
  cityName?: string;
  cityType?: string;
  genre?: CityGenre;
  reputation?: string;
  tone?: CityTone;
  knownFor?: string;
  geography?: string;
  powerOrCulture?: string;
  nicknameStyles?: CityNicknameStyle[];
  count?: 6 | 12 | 20;
}

export interface CityNicknameGenerateRouteRequest
  extends CityNicknameGenerateRequest {
  turnstileToken?: string;
  locale?: string;
}

export interface NormalizedCityNicknameRequest {
  cityName: string;
  cityType: string;
  genre: CityGenre;
  reputation: string;
  tone: CityTone;
  knownFor: string;
  geography: string;
  powerOrCulture: string;
  nicknameStyles: CityNicknameStyle[];
  count: 6 | 12 | 20;
  locale: string;
}

export interface CityNicknameResult {
  nickname: string;
  style: CityNicknameStyle;
  vibe: CityTone;
  whyItFits: string;
  bestFor: string;
}

export interface CityNicknameGenerateResponse {
  results: CityNicknameResult[];
  grouped: Record<CityNicknameStyle, CityNicknameResult[]>;
  meta: {
    cityType: string;
    genre: CityGenre;
    tone: CityTone;
    count: number;
  };
}

export interface CityNicknameHistoryItem {
  id: string;
  createdAt: number;
  input: NormalizedCityNicknameRequest;
  results: CityNicknameResult[];
}
