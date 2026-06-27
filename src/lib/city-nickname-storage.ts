import type {
  CityNicknameHistoryItem,
  NormalizedCityNicknameRequest,
} from "@/types/city-nickname";

export const CITY_NICKNAME_PROMPT_KEY = (locale: string) =>
  `city-nickname-generator:prompt:${locale}`;

export const CITY_NICKNAME_HISTORY_KEY = (locale: string) =>
  `city-nickname-generator:history:${locale}`;

export function clampCityNicknameHistory(history: CityNicknameHistoryItem[]) {
  return [...history]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);
}

export const CityNicknameStorage = {
  savePrompt(locale: string, value: Partial<NormalizedCityNicknameRequest>) {
    localStorage.setItem(CITY_NICKNAME_PROMPT_KEY(locale), JSON.stringify(value));
  },
  getPrompt(locale: string) {
    const raw = localStorage.getItem(CITY_NICKNAME_PROMPT_KEY(locale));
    return raw ? JSON.parse(raw) : null;
  },
  saveHistory(locale: string, history: CityNicknameHistoryItem[]) {
    localStorage.setItem(
      CITY_NICKNAME_HISTORY_KEY(locale),
      JSON.stringify(clampCityNicknameHistory(history))
    );
  },
  getHistory(locale: string): CityNicknameHistoryItem[] {
    const raw = localStorage.getItem(CITY_NICKNAME_HISTORY_KEY(locale));
    return raw ? clampCityNicknameHistory(JSON.parse(raw)) : [];
  },
};
