import type { SavedIncorrectQuote } from "@/types/blocks/incorrect-quote-generate";

function isSavedIncorrectQuote(value: unknown): value is SavedIncorrectQuote {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.prompt === "string" &&
    typeof item.output === "string" &&
    Array.isArray(item.characters) &&
    item.characters.every((entry) => typeof entry === "string") &&
    typeof item.relationshipMode === "string" &&
    typeof item.tone === "string" &&
    typeof item.length === "string" &&
    typeof item.mode === "string" &&
    !!item.safety &&
    typeof item.safety === "object" &&
    typeof (item.safety as Record<string, unknown>).noRomance === "boolean" &&
    typeof (item.safety as Record<string, unknown>).avoidShipping === "boolean" &&
    typeof (item.safety as Record<string, unknown>).keepItClean === "boolean"
  );
}

export class IncorrectQuoteStorage {
  private static readonly STORAGE_KEY = "incorrect_quote_history";
  private static readonly MAX_HISTORY_ITEMS = 12;

  static saveHistory(item: Omit<SavedIncorrectQuote, "id" | "createdAt">): void {
    try {
      if (typeof window === "undefined") {
        return;
      }

      const history = this.getHistory();
      const newItem: SavedIncorrectQuote = {
        ...item,
        id: `incorrect_quote_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      const next = [newItem, ...history].slice(0, this.MAX_HISTORY_ITEMS);
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save incorrect quote history:", error);
    }
  }

  static getHistory(): SavedIncorrectQuote[] {
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
        ? parsed.filter(isSavedIncorrectQuote)
        : [];
    } catch (error) {
      console.error("Failed to read incorrect quote history:", error);
      return [];
    }
  }

  static getById(id: string): SavedIncorrectQuote | undefined {
    try {
      return this.getHistory().find((item) => item.id === id);
    } catch (error) {
      console.error("Failed to read incorrect quote by id:", error);
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
      console.error("Failed to delete incorrect quote history item:", error);
    }
  }

  static clearHistory(): void {
    try {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear incorrect quote history:", error);
    }
  }
}
