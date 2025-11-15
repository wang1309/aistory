/**
 * LocalStorage Poem 存储管理工具
 * 用于保存和管理用户生成的 Poem 历史记录
 */

import type { PoemData } from '@/types/poem';

const POEM_STORAGE_KEY = 'saved_poems';
const MAX_POEMS = 10;

/**
 * Poem 存储管理器
 */
export const PoemStorage = {
  /**
   * 保存 Poem 到 LocalStorage
   * @param poem Poem 对象(不含 id 和 createdAt，会自动生成)
   * @returns 保存后的完整 Poem 对象
   */
  savePoem(poem: Omit<PoemData, 'id' | 'createdAt'>): PoemData {
    const newPoem: PoemData = {
      ...poem,
      id: `poem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    try {
      const poems = this.getPoems();
      poems.unshift(newPoem); // 添加到开头(最新的在前)

      // 限制数量，只保留最近 MAX_POEMS 个
      const limitedPoems = poems.slice(0, MAX_POEMS);
      localStorage.setItem(POEM_STORAGE_KEY, JSON.stringify(limitedPoems));

      return newPoem;
    } catch (error) {
      console.error('Failed to save poem to localStorage:', error);
      return newPoem;
    }
  },

  /**
   * 获取所有保存的 Poem
   * @returns Poem 数组，按时间倒序(最新在前)
   */
  getPoems(): PoemData[] {
    try {
      const data = localStorage.getItem(POEM_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load poems from localStorage:', error);
      return [];
    }
  },

  /**
   * 根据 ID 获取单个 Poem
   * @param id Poem ID
   * @returns Poem 对象，如果不存在返回 null
   */
  getPoemById(id: string): PoemData | null {
    const poems = this.getPoems();
    return poems.find(p => p.id === id) || null;
  },

  /**
   * 根据类型筛选 Poem
   * @param poemType 诗歌类型
   * @returns 过滤后的 Poem 数组
   */
  getPoemsByType(poemType: string): PoemData[] {
    return this.getPoems().filter(p => p.poemType === poemType);
  },

  /**
   * 搜索 Poem（按 prompt 或 content）
   * @param query 搜索关键词
   * @returns 匹配的 Poem 数组
   */
  searchPoems(query: string): PoemData[] {
    const lowerQuery = query.toLowerCase();
    return this.getPoems().filter(
      p =>
        p.prompt.toLowerCase().includes(lowerQuery) ||
        p.content.toLowerCase().includes(lowerQuery) ||
        p.title?.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * 更新 Poem
   * @param id Poem ID
   * @param updates 要更新的字段
   */
  updatePoem(id: string, updates: Partial<PoemData>): void {
    try {
      const poems = this.getPoems();
      const index = poems.findIndex(p => p.id === id);

      if (index !== -1) {
        poems[index] = { ...poems[index], ...updates };
        localStorage.setItem(POEM_STORAGE_KEY, JSON.stringify(poems));
      }
    } catch (error) {
      console.error('Failed to update poem:', error);
    }
  },

  /**
   * 删除指定 Poem
   * @param id Poem ID
   */
  deletePoem(id: string): void {
    try {
      const poems = this.getPoems().filter(p => p.id !== id);
      localStorage.setItem(POEM_STORAGE_KEY, JSON.stringify(poems));
    } catch (error) {
      console.error('Failed to delete poem:', error);
    }
  },

  /**
   * 清空所有保存的 Poem
   */
  clearAllPoems(): void {
    try {
      localStorage.removeItem(POEM_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear poems:', error);
    }
  },

  /**
   * 获取存储的 Poem 数量
   * @returns Poem 总数
   */
  getPoemsCount(): number {
    return this.getPoems().length;
  },

  /**
   * 检查是否已达到最大存储数量
   * @returns 是否已满
   */
  isFull(): boolean {
    return this.getPoemsCount() >= MAX_POEMS;
  },

  /**
   * 导出所有 Poem 为 JSON
   * @returns JSON 字符串
   */
  exportToJSON(): string {
    const poems = this.getPoems();
    return JSON.stringify(poems, null, 2);
  },

  /**
   * 从 JSON 导入 Poem
   * @param jsonString JSON 字符串
   * @param append 是否追加到现有数据（false 则覆盖）
   */
  importFromJSON(jsonString: string, append: boolean = false): boolean {
    try {
      const importedPoems: PoemData[] = JSON.parse(jsonString);

      if (!Array.isArray(importedPoems)) {
        throw new Error('Invalid JSON format');
      }

      let poems = append ? this.getPoems() : [];
      poems = [...poems, ...importedPoems];

      // 去重（按 id）
      const uniquePoems = Array.from(
        new Map(poems.map(p => [p.id, p])).values()
      );

      // 限制数量
      const limitedPoems = uniquePoems.slice(0, MAX_POEMS);
      localStorage.setItem(POEM_STORAGE_KEY, JSON.stringify(limitedPoems));

      return true;
    } catch (error) {
      console.error('Failed to import poems from JSON:', error);
      return false;
    }
  },

  /**
   * 获取 Poem 统计信息
   * @returns 统计对象
   */
  getPoemStats() {
    const poems = this.getPoems();

    const typeCount: Record<string, number> = {
      modern: 0,
      classical: 0,
      format: 0,
      lyric: 0
    };

    const modelCount: Record<string, number> = {};
    let totalLines = 0;

    poems.forEach(poem => {
      typeCount[poem.poemType]++;
      modelCount[poem.model] = (modelCount[poem.model] || 0) + 1;

      // 计算行数
      const lines = poem.content.split('\n').filter(line => line.trim());
      totalLines += lines.length;
    });

    // 找出最常用的类型
    const mostUsedType = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // 找出最常用的模型
    const mostUsedModel = Object.entries(modelCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    return {
      totalPoems: poems.length,
      mostUsedType,
      mostUsedModel,
      averageLength: poems.length > 0 ? Math.round(totalLines / poems.length) : 0,
      typeDistribution: typeCount,
      modelDistribution: modelCount
    };
  }
};

// 导出常量供外部使用
export const MAX_POEMS_LIMIT = MAX_POEMS;
