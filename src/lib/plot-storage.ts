/**
 * LocalStorage Plot 存储管理工具
 * 用于保存和管理用户生成的 Plot 历史记录以及 Plot-Story 关联关系
 */

import type { PlotData, PlotStoryLink } from '@/types/plot';

const PLOT_STORAGE_KEY = 'saved_plots';
const PLOT_STORY_LINKS_KEY = 'plot_story_links';
const MAX_PLOTS = 10;

/**
 * Plot 存储管理器
 */
export const PlotStorage = {
  /**
   * 保存 Plot 到 LocalStorage
   * @param plot Plot 对象(不含 id、createdAt 和 storyCount,会自动生成)
   * @returns 保存后的完整 Plot 对象
   */
  savePlot(plot: Omit<PlotData, 'id' | 'createdAt' | 'storyCount'>): PlotData {
    const newPlot: PlotData = {
      ...plot,
      id: `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      storyCount: 0
    };

    try {
      const plots = this.getPlots();
      plots.unshift(newPlot); // 添加到开头(最新的在前)

      // 限制数量,只保留最近 MAX_PLOTS 个
      const limitedPlots = plots.slice(0, MAX_PLOTS);
      localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(limitedPlots));

      return newPlot;
    } catch (error) {
      console.error('Failed to save plot to localStorage:', error);
      return newPlot;
    }
  },

  /**
   * 获取所有保存的 Plot
   * @returns Plot 数组,按时间倒序(最新在前)
   */
  getPlots(): PlotData[] {
    try {
      const data = localStorage.getItem(PLOT_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load plots from localStorage:', error);
      return [];
    }
  },

  /**
   * 根据 ID 获取单个 Plot
   * @param id Plot ID
   * @returns Plot 对象,如果不存在返回 null
   */
  getPlotById(id: string): PlotData | null {
    const plots = this.getPlots();
    return plots.find(p => p.id === id) || null;
  },

  /**
   * 更新 Plot
   * @param id Plot ID
   * @param updates 要更新的字段
   */
  updatePlot(id: string, updates: Partial<PlotData>): void {
    try {
      const plots = this.getPlots();
      const index = plots.findIndex(p => p.id === id);

      if (index !== -1) {
        plots[index] = { ...plots[index], ...updates };
        localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(plots));
      }
    } catch (error) {
      console.error('Failed to update plot:', error);
    }
  },

  /**
   * 删除指定 Plot
   * @param id Plot ID
   */
  deletePlot(id: string): void {
    try {
      const plots = this.getPlots().filter(p => p.id !== id);
      localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(plots));

      // 同时删除相关的 Plot-Story 关联
      this.deletePlotLinks(id);
    } catch (error) {
      console.error('Failed to delete plot:', error);
    }
  },

  /**
   * 清空所有保存的 Plot
   */
  clearAllPlots(): void {
    try {
      localStorage.removeItem(PLOT_STORAGE_KEY);
      localStorage.removeItem(PLOT_STORY_LINKS_KEY);
    } catch (error) {
      console.error('Failed to clear plots:', error);
    }
  },

  /**
   * 获取存储的 Plot 数量
   * @returns Plot 总数
   */
  getPlotsCount(): number {
    return this.getPlots().length;
  },

  /**
   * 检查是否已达到最大存储数量
   * @returns 是否已满
   */
  isFull(): boolean {
    return this.getPlotsCount() >= MAX_PLOTS;
  },

  // ============ Plot-Story 关联管理 ============

  /**
   * 获取所有 Plot-Story 关联关系
   * @returns 关联关系数组
   */
  getPlotStoryLinks(): PlotStoryLink[] {
    try {
      const data = localStorage.getItem(PLOT_STORY_LINKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load plot-story links:', error);
      return [];
    }
  },

  /**
   * 创建 Plot-Story 关联
   * @param plotId Plot ID
   * @param storyId Story ID
   */
  linkPlotToStory(plotId: string, storyId: string): void {
    try {
      const links = this.getPlotStoryLinks();

      // 检查是否已存在相同关联
      const exists = links.some(
        link => link.plotId === plotId && link.storyId === storyId
      );

      if (!exists) {
        const newLink: PlotStoryLink = {
          plotId,
          storyId,
          createdAt: new Date().toISOString()
        };

        links.push(newLink);
        localStorage.setItem(PLOT_STORY_LINKS_KEY, JSON.stringify(links));

        // 更新 Plot 的 storyCount
        this.updatePlotStoryCount(plotId);
      }
    } catch (error) {
      console.error('Failed to link plot to story:', error);
    }
  },

  /**
   * 获取指定 Plot 关联的所有 Story ID
   * @param plotId Plot ID
   * @returns Story ID 数组
   */
  getStoriesByPlot(plotId: string): string[] {
    const links = this.getPlotStoryLinks();
    return links
      .filter(link => link.plotId === plotId)
      .map(link => link.storyId);
  },

  /**
   * 获取指定 Story 关联的 Plot ID
   * @param storyId Story ID
   * @returns Plot ID 或 null
   */
  getPlotByStory(storyId: string): string | null {
    const links = this.getPlotStoryLinks();
    const link = links.find(link => link.storyId === storyId);
    return link ? link.plotId : null;
  },

  /**
   * 删除指定 Plot 的所有关联
   * @param plotId Plot ID
   */
  deletePlotLinks(plotId: string): void {
    try {
      const links = this.getPlotStoryLinks();
      const filteredLinks = links.filter(link => link.plotId !== plotId);
      localStorage.setItem(PLOT_STORY_LINKS_KEY, JSON.stringify(filteredLinks));
    } catch (error) {
      console.error('Failed to delete plot links:', error);
    }
  },

  /**
   * 删除指定 Story 的关联
   * @param storyId Story ID
   */
  deleteStoryLink(storyId: string): void {
    try {
      const links = this.getPlotStoryLinks();
      const link = links.find(l => l.storyId === storyId);

      if (link) {
        const filteredLinks = links.filter(l => l.storyId !== storyId);
        localStorage.setItem(PLOT_STORY_LINKS_KEY, JSON.stringify(filteredLinks));

        // 更新 Plot 的 storyCount
        this.updatePlotStoryCount(link.plotId);
      }
    } catch (error) {
      console.error('Failed to delete story link:', error);
    }
  },

  /**
   * 更新 Plot 的 storyCount
   * @param plotId Plot ID
   */
  updatePlotStoryCount(plotId: string): void {
    try {
      const storyCount = this.getStoriesByPlot(plotId).length;
      this.updatePlot(plotId, { storyCount });
    } catch (error) {
      console.error('Failed to update plot story count:', error);
    }
  },

  /**
   * 获取 Plot 统计信息
   * @returns 统计对象
   */
  getPlotStats() {
    const plots = this.getPlots();
    const links = this.getPlotStoryLinks();

    const complexityCount: Record<string, number> = {
      simple: 0,
      medium: 0,
      complex: 0
    };

    const modelCount: Record<string, number> = {};

    plots.forEach(plot => {
      complexityCount[plot.complexity]++;
      modelCount[plot.model] = (modelCount[plot.model] || 0) + 1;
    });

    // 找出最常用的模型
    const mostUsedModel = Object.entries(modelCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // 计算平均复杂度
    const avgComplexity = plots.length > 0
      ? complexityCount.complex > complexityCount.simple
        ? 'complex'
        : complexityCount.medium > complexityCount.simple
          ? 'medium'
          : 'simple'
      : 'unknown';

    return {
      totalPlots: plots.length,
      totalStories: links.length,
      averageComplexity: avgComplexity,
      mostUsedModel,
      complexityDistribution: complexityCount,
      modelDistribution: modelCount
    };
  }
};

// 导出常量供外部使用
export const MAX_PLOTS_LIMIT = MAX_PLOTS;
