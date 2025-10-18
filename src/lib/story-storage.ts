/**
 * LocalStorage故事存储管理工具
 * 用于保存和管理用户生成的故事历史记录
 */

export interface SavedStory {
  id: string;                    // 唯一ID (timestamp + random)
  title: string;                 // 标题(prompt前30字)
  prompt: string;                // 完整prompt
  content: string;               // 故事内容
  wordCount: number;             // 字数
  model: string;                 // AI模型
  format?: string;               // 格式
  genre?: string;                // 类型
  tone?: string;                 // 风格
  createdAt: string;             // 创建时间 ISO string
}

const STORAGE_KEY = 'saved_stories';
const MAX_STORIES = 10;

/**
 * 故事存储管理器
 */
export const StoryStorage = {
  /**
   * 保存故事到LocalStorage
   * @param story 故事对象(不含id和createdAt,会自动生成)
   * @returns 保存后的完整故事对象
   */
  saveStory(story: Omit<SavedStory, 'id' | 'createdAt'>): SavedStory {
    const newStory: SavedStory = {
      ...story,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    try {
      const stories = this.getStories();
      stories.unshift(newStory); // 添加到开头(最新的在前)

      // 限制数量,只保留最近MAX_STORIES个
      const limitedStories = stories.slice(0, MAX_STORIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedStories));

      return newStory;
    } catch (error) {
      console.error('Failed to save story to localStorage:', error);
      return newStory;
    }
  },

  /**
   * 获取所有保存的故事
   * @returns 故事数组,按时间倒序(最新在前)
   */
  getStories(): SavedStory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load stories from localStorage:', error);
      return [];
    }
  },

  /**
   * 根据ID获取单个故事
   * @param id 故事ID
   * @returns 故事对象,如果不存在返回null
   */
  getStoryById(id: string): SavedStory | null {
    const stories = this.getStories();
    return stories.find(s => s.id === id) || null;
  },

  /**
   * 删除指定故事
   * @param id 故事ID
   */
  deleteStory(id: string): void {
    try {
      const stories = this.getStories().filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    } catch (error) {
      console.error('Failed to delete story:', error);
    }
  },

  /**
   * 清空所有保存的故事
   */
  clearAllStories(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stories:', error);
    }
  },

  /**
   * 获取存储的故事数量
   * @returns 故事总数
   */
  getStoriesCount(): number {
    return this.getStories().length;
  },

  /**
   * 检查是否已达到最大存储数量
   * @returns 是否已满
   */
  isFull(): boolean {
    return this.getStoriesCount() >= MAX_STORIES;
  }
};

// 导出常量供外部使用
export const MAX_STORIES_LIMIT = MAX_STORIES;
