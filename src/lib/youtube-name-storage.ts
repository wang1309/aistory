import type { SavedYoutubeName } from "@/types/blocks/youtube-name-generate";

function isSavedYoutubeName(value: unknown): value is SavedYoutubeName {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.niche === "string" &&
    typeof item.audience === "string" &&
    typeof item.style === "string" &&
    typeof item.lengthPreference === "string" &&
    typeof item.pivotFlexibility === "string" &&
    Array.isArray(item.keywords) &&
    typeof item.creatorName === "string" &&
    typeof item.outputLanguage === "string" &&
    Array.isArray(item.output) &&
    typeof item.recommendedName === "string" &&
    typeof item.recommendedReason === "string"
  );
}

export class YoutubeNameStorage {
  private static readonly STORAGE_KEY = "youtube_name_history";
  private static readonly MAX_HISTORY_ITEMS = 8;

  static saveHistory(item: Omit<SavedYoutubeName, "id" | "createdAt">): void {
    try {
      if (typeof window === "undefined") return;
      const history = this.getHistory();
      const newItem: SavedYoutubeName = {
        ...item,
        id: `youtube_name_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const next = [newItem, ...history].slice(0, this.MAX_HISTORY_ITEMS);
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save YouTube name history:", error);
    }
  }

  static getHistory(): SavedYoutubeName[] {
    try {
      if (typeof window === "undefined") return [];
      const data = window.localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.filter(isSavedYoutubeName) : [];
    } catch (error) {
      console.error("Failed to read YouTube name history:", error);
      return [];
    }
  }

  static deleteById(id: string): void {
    try {
      if (typeof window === "undefined") return;
      const next = this.getHistory().filter((item) => item.id !== id);
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to delete YouTube name history item:", error);
    }
  }

  static clearHistory(): void {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear YouTube name history:", error);
    }
  }
}
