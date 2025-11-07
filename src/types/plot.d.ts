// Plot Generator 类型定义

/**
 * Plot 数据结构（保存到 LocalStorage）
 */
export interface PlotData {
  id: string;
  title: string;
  prompt: string;
  content: string; // Markdown 格式的 Plot 内容
  model: string; // 'fast' | 'standard' | 'creative'

  // Plot 特有参数
  complexity: 'simple' | 'medium' | 'complex';
  mainCharacterCount: number; // 1-3
  supportingCharacterCount: number; // 0-5
  plotPointCount: number; // 3-9
  subPlotCount: number; // 0-3
  conflictTypes: string[]; // ['internal', 'external', 'both']
  emotionalArc: string; // 'growth' | 'fall' | 'awakening' | 'redemption' | 'exploration'
  suspenseStyle: string; // 'opening' | 'middle' | 'multiple' | 'none'

  // 可选参数（继承自 Story Generator）
  genre?: string;
  tone?: string;
  perspective?: string;
  locale?: string; // AI 输出语言（12种选择）

  // 元数据
  createdAt: string; // ISO 时间戳
  storyCount: number; // 关联的 Story 数量
}

/**
 * Plot 生成参数
 */
export interface PlotGenerateOptions {
  // 基础参数
  prompt: string;
  model: 'fast' | 'standard' | 'creative';
  locale: string; // AI 输出语言

  // Plot 核心参数
  complexity: 'simple' | 'medium' | 'complex';
  mainCharacterCount: number;
  supportingCharacterCount: number;
  plotPointCount: number;
  subPlotCount: number;
  conflictTypes: string[];
  emotionalArc: string;
  suspenseStyle: string;

  // 可选的故事类型参数（继承自 Story）
  genre?: string;
  tone?: string;
  perspective?: string;

  // 可选的角色设置
  characterSettings?: {
    protagonist?: string;
    deuteragonist?: string;
    antagonist?: string;
  };

  // Turnstile 验证
  turnstileToken?: string;
}

/**
 * Plot-Story 关联关系
 */
export interface PlotStoryLink {
  plotId: string;
  storyId: string;
  createdAt: string;
}

/**
 * Plot 生成响应
 */
export interface PlotGenerateResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * 复杂度配置映射
 */
export interface ComplexityConfig {
  plotPoints: number;
  chapters: number;
  minCharacters: number;
  maxCharacters: number;
}

/**
 * Plot 参数选项（用于 UI 选择器）
 */
export interface PlotOptions {
  complexity: Array<{ value: string; label: string; description: string }>;
  emotionalArc: Array<{ value: string; label: string; description: string }>;
  suspenseStyle: Array<{ value: string; label: string; description: string }>;
  conflictTypes: Array<{ value: string; label: string; description: string }>;
}

/**
 * Plot 可视化节点数据
 */
export interface PlotNode {
  id: string;
  type: 'chapter' | 'plot-point' | 'character' | 'subplot';
  title: string;
  description: string;
  order: number;
  isEditable: boolean;
}

/**
 * Plot 统计信息
 */
export interface PlotStats {
  totalPlots: number;
  totalStories: number; // 从 Plot 生成的 Story 总数
  averageComplexity: string;
  mostUsedModel: string;
}
