import { SavedFanfic } from '@/types/blocks/fanfic-generate';

/**
 * LocalStorage helper for fanfic generation history
 */
export class FanficStorage {
  private static readonly STORAGE_KEY = 'fanfic_history';
  private static readonly MAX_HISTORY_ITEMS = 10;

  /**
   * Save a new fanfic to history
   */
  static saveHistory(item: Omit<SavedFanfic, 'id' | 'createdAt'>): void {
    try {
      const history = this.getHistory();
      const newItem: SavedFanfic = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      history.unshift(newItem);
      const trimmedHistory = history.slice(0, this.MAX_HISTORY_ITEMS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to save fanfic history:', error);
    }
  }

  /**
   * Get all fanfic history
   */
  static getHistory(): SavedFanfic[] {
    try {
      if (typeof window === 'undefined') return [];
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get fanfic history:', error);
      return [];
    }
  }

  /**
   * Get a specific fanfic by ID
   */
  static getById(id: string): SavedFanfic | undefined {
    try {
      const history = this.getHistory();
      return history.find((item) => item.id === id);
    } catch (error) {
      console.error('Failed to get fanfic by ID:', error);
      return undefined;
    }
  }

  /**
   * Delete a specific fanfic by ID
   */
  static deleteById(id: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter((item) => item.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete fanfic:', error);
    }
  }

  /**
   * Clear all fanfic history
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear fanfic history:', error);
    }
  }

  /**
   * Get history filtered by source work
   */
  static getBySourceWork(sourceName: string): SavedFanfic[] {
    try {
      const history = this.getHistory();
      return history.filter((item) => item.source.name === sourceName);
    } catch (error) {
      console.error('Failed to filter fanfic by source:', error);
      return [];
    }
  }

  /**
   * Get history filtered by pairing
   */
  static getByPairing(characters: string[]): SavedFanfic[] {
    try {
      const history = this.getHistory();
      return history.filter((item) => {
        const itemChars = item.pairing.characters.sort();
        const searchChars = characters.sort();
        return JSON.stringify(itemChars) === JSON.stringify(searchChars);
      });
    } catch (error) {
      console.error('Failed to filter fanfic by pairing:', error);
      return [];
    }
  }

  /**
   * Get history filtered by plot type
   */
  static getByPlotType(plotType: string): SavedFanfic[] {
    try {
      const history = this.getHistory();
      return history.filter((item) => item.plotType === plotType);
    } catch (error) {
      console.error('Failed to filter fanfic by plot type:', error);
      return [];
    }
  }

  /**
   * Get history statistics
   */
  static getStats(): {
    totalFanfics: number;
    totalWords: number;
    mostUsedSource: string | null;
    mostUsedPlotType: string | null;
    averageWordCount: number;
  } {
    try {
      const history = this.getHistory();
      const totalFanfics = history.length;
      const totalWords = history.reduce((sum, item) => sum + item.wordCount, 0);
      const averageWordCount = totalFanfics > 0 ? Math.round(totalWords / totalFanfics) : 0;

      // Find most used source
      const sourceCount: Record<string, number> = {};
      history.forEach((item) => {
        sourceCount[item.source.name] = (sourceCount[item.source.name] || 0) + 1;
      });
      const mostUsedSource =
        Object.keys(sourceCount).length > 0
          ? Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0][0]
          : null;

      // Find most used plot type
      const plotTypeCount: Record<string, number> = {};
      history.forEach((item) => {
        plotTypeCount[item.plotType] = (plotTypeCount[item.plotType] || 0) + 1;
      });
      const mostUsedPlotType =
        Object.keys(plotTypeCount).length > 0
          ? Object.entries(plotTypeCount).sort((a, b) => b[1] - a[1])[0][0]
          : null;

      return {
        totalFanfics,
        totalWords,
        mostUsedSource,
        mostUsedPlotType,
        averageWordCount,
      };
    } catch (error) {
      console.error('Failed to get fanfic stats:', error);
      return {
        totalFanfics: 0,
        totalWords: 0,
        mostUsedSource: null,
        mostUsedPlotType: null,
        averageWordCount: 0,
      };
    }
  }
}
