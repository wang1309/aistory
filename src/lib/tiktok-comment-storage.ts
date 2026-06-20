import type { SavedTiktokComment } from "@/types/blocks/tiktok-comment-generate";

function isSavedTiktokComment(value: unknown): value is SavedTiktokComment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.comment === "string" &&
    typeof item.context === "string" &&
    typeof item.replyGoal === "string" &&
    typeof item.tone === "string" &&
    typeof item.length === "string" &&
    typeof item.mode === "string" &&
    typeof item.outputLanguage === "string" &&
    typeof item.output === "string"
  );
}

export class TiktokCommentStorage {
  private static readonly STORAGE_KEY = "tiktok_comment_history";
  private static readonly MAX_HISTORY_ITEMS = 12;

  static saveHistory(
    item: Omit<SavedTiktokComment, "id" | "createdAt">
  ): void {
    try {
      if (typeof window === "undefined") {
        return;
      }

      const history = this.getHistory();
      const newItem: SavedTiktokComment = {
        ...item,
        id: `tiktok_comment_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      const next = [newItem, ...history].slice(0, this.MAX_HISTORY_ITEMS);
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save TikTok comment history:", error);
    }
  }

  static getHistory(): SavedTiktokComment[] {
    try {
      if (typeof window === "undefined") {
        return [];
      }

      const data = window.localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data);
      return Array.isArray(parsed)
        ? parsed.filter(isSavedTiktokComment)
        : [];
    } catch (error) {
      console.error("Failed to read TikTok comment history:", error);
      return [];
    }
  }

  static getById(id: string): SavedTiktokComment | undefined {
    try {
      return this.getHistory().find((item) => item.id === id);
    } catch (error) {
      console.error("Failed to read TikTok comment by id:", error);
      return undefined;
    }
  }

  static deleteById(id: string): void {
    try {
      if (typeof window === "undefined") {
        return;
      }

      const next = this.getHistory().filter((item) => item.id !== id);
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to delete TikTok comment history item:", error);
    }
  }

  static clearHistory(): void {
    try {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear TikTok comment history:", error);
    }
  }
}
