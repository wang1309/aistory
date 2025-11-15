// Poem Generator 类型定义

/**
 * 诗歌数据结构（保存到 LocalStorage）
 */
export interface PoemData {
  id: string;
  title?: string;
  prompt: string;
  content: string; // 诗歌内容
  model: string; // 'fast' | 'standard' | 'creative'

  // Poem 特有参数
  poemType: 'modern' | 'classical' | 'format' | 'lyric';
  length: 'short' | 'medium' | 'long';
  rhymeScheme?: string; // 韵律方案
  theme?: string; // 主题
  mood?: string; // 情感
  style?: string; // 风格/流派

  // 古典诗词特有参数
  classicalOptions?: ClassicalPoemOptions;

  // 输出语言
  locale?: string; // AI 输出语言（12种选择）

  // 分析数据
  analysis?: PoemAnalysis;

  // 音频数据
  audioUrl?: string; // TTS 音频 URL

  // 元数据
  createdAt: string; // ISO 时间戳
}

/**
 * 古典诗词专属选项
 */
export interface ClassicalPoemOptions {
  form: '五言绝句' | '七言绝句' | '五言律诗' | '七言律诗' | '词' | string;
  cipaiName?: string; // 词牌名（当 form 为 '词' 时）
  strictTone?: boolean; // 是否严格遵守平仄
}

/**
 * 诗歌分析数据
 */
export interface PoemAnalysis {
  imagery: Array<{ image: string; significance: string }> | string[]; // 意象列表（支持对象或字符串格式）
  rhymeAnalysis: string; // 韵律分析
  rhetoricalDevices: string[]; // 修辞手法
  emotionalTone: string; // 情感基调
  themeInterpretation: string; // 主题解读
}

/**
 * Poem 生成参数
 */
export interface PoemGenerateOptions {
  // 基础参数
  prompt: string;
  model: 'fast' | 'standard' | 'creative';
  locale: string; // AI 输出语言

  // Poem 核心参数
  poemType: 'modern' | 'classical' | 'format' | 'lyric';
  length: 'short' | 'medium' | 'long';
  rhymeScheme?: string;
  theme?: string;
  mood?: string;
  style?: string;

  // 古典诗词参数
  classicalOptions?: ClassicalPoemOptions;

  // Turnstile 验证
  turnstileToken?: string;
}

/**
 * Poem 生成响应
 */
export interface PoemGenerateResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Poem 分析请求参数
 */
export interface PoemAnalyzeOptions {
  poemContent: string;
  poemType: string;
  locale: string;
}

/**
 * Poem 分析响应
 */
export interface PoemAnalyzeResponse {
  success: boolean;
  analysis?: PoemAnalysis;
  error?: string;
}

/**
 * TTS 请求参数
 */
export interface PoemTTSOptions {
  poemContent: string;
  language: string;
  voice?: string;
}

/**
 * TTS 响应
 */
export interface PoemTTSResponse {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  error?: string;
}

/**
 * Poem 参数选项（用于 UI 选择器）
 */
export interface PoemOptions {
  poemTypes: Array<{ value: string; label: string; description: string }>;
  lengths: Array<{ value: string; label: string; description: string }>;
  rhymeSchemes: Array<{ value: string; label: string; description: string }>;
  themes: Array<{ value: string; label: string; description: string }>;
  moods: Array<{ value: string; label: string; description: string }>;
  styles: Array<{ value: string; label: string; description: string }>;
  classicalForms: Array<{ value: string; label: string; description: string }>;
  cipaiNames: Array<{ value: string; label: string; description: string }>;
}

/**
 * Poem 统计信息
 */
export interface PoemStats {
  totalPoems: number;
  mostUsedType: string;
  mostUsedModel: string;
  averageLength: number;
}
