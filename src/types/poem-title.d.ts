// Poem Title Generator 类型定义

/**
 * 诗歌标题生成请求参数
 */
export interface PoemTitleGenerateOptions {
    poemContent: string;        // 诗歌全文或主题关键词
    language: 'zh' | 'en' | 'bilingual';  // 中文/英文/双语
    styles: string[];           // 风格标签数组
    moods: string[];            // 情绪标签数组
    length: 'short' | 'medium' | 'long';  // 4-8字/8-12字/12字以上
    usageScene: string;         // 使用场景
    turnstileToken?: string;    // Turnstile 验证 token
}

/**
 * 生成的标题项
 */
export interface GeneratedPoemTitle {
    id: string;
    title: string;
    explanation: string;         // 标题与诗歌意象/情绪的对应关系
    category: 'literary' | 'platform';  // 文学向/平台向
    englishTitle?: string;       // 双语模式时的英文标题
    recommendedPlatform?: string;  // 推荐发布平台
}

/**
 * 诗歌标题生成响应
 */
export interface PoemTitleGenerateResponse {
    success: boolean;
    titles?: GeneratedPoemTitle[];
    error?: string;
}

/**
 * 标题历史记录项
 */
export interface PoemTitleHistoryItem {
    id: string;
    poemContent: string;
    titles: GeneratedPoemTitle[];
    language: string;
    styles: string[];
    moods: string[];
    length: string;
    usageScene: string;
    timestamp: number;
}
