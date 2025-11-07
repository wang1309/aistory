/**
 * Plot Generator AI Prompt 工程
 * 根据用户参数构建结构化的 Plot 生成 Prompt
 */

import type { PlotGenerateOptions } from '@/types/plot';

/**
 * 复杂度配置映射
 */
const complexityConfig = {
  simple: {
    plotPoints: 3,
    chapters: 0,
    description: {
      zh: '简单的故事结构，3个关键情节点',
      en: 'Simple story structure with 3 key plot points'
    }
  },
  medium: {
    plotPoints: 5,
    chapters: 5,
    description: {
      zh: '中等复杂度，5个情节点，5章大纲',
      en: 'Medium complexity with 5 plot points and 5 chapter outline'
    }
  },
  complex: {
    plotPoints: 9,
    chapters: 10,
    description: {
      zh: '复杂故事结构，9个情节点，10章详细大纲',
      en: 'Complex story structure with 9 plot points and 10 detailed chapters'
    }
  }
};

/**
 * 语言名称映射（支持 12 种输出语言）
 */
const languageNames: Record<string, { native: string; english: string }> = {
  'en': { native: 'English', english: 'English' },
  'zh': { native: '中文', english: 'Chinese' },
  'ja': { native: '日本語', english: 'Japanese' },
  'ko': { native: '한국어', english: 'Korean' },
  'es': { native: 'Español', english: 'Spanish' },
  'fr': { native: 'Français', english: 'French' },
  'de': { native: 'Deutsch', english: 'German' },
  'pt': { native: 'Português', english: 'Portuguese' },
  'ru': { native: 'Русский', english: 'Russian' },
  'ar': { native: 'العربية', english: 'Arabic' },
  'hi': { native: 'हिन्दी', english: 'Hindi' },
  'it': { native: 'Italiano', english: 'Italian' },
};

/**
 * 情节点标题映射（用于生成结构化大纲）
 */
const plotPointTitles = [
  { zh: '开场', en: 'Opening Scene' },
  { zh: '触发事件', en: 'Inciting Incident' },
  { zh: '第一转折点', en: 'First Plot Point' },
  { zh: '上升动作', en: 'Rising Action' },
  { zh: '中点', en: 'Midpoint' },
  { zh: '关键转折', en: 'Pinch Point' },
  { zh: '第二转折点', en: 'Second Plot Point' },
  { zh: '高潮', en: 'Climax' },
  { zh: '回落', en: 'Falling Action' },
  { zh: '结局', en: 'Resolution' }
];

/**
 * 冲突类型描述映射
 */
const conflictTypeDescriptions: Record<string, { zh: string; en: string }> = {
  'internal': {
    zh: '内在冲突（角色的内心挣扎和自我矛盾）',
    en: 'Internal Conflict (character\'s inner struggles and self-contradiction)'
  },
  'external': {
    zh: '外在冲突（角色与外部力量的对抗）',
    en: 'External Conflict (character vs external forces)'
  },
  'both': {
    zh: '双重冲突（内在与外在冲突交织）',
    en: 'Dual Conflict (intertwined internal and external conflicts)'
  }
};

/**
 * 情感弧线描述映射
 */
const emotionalArcDescriptions: Record<string, { zh: string; en: string }> = {
  'growth': {
    zh: '成长型（角色从弱小/无知成长为强大/智慧）',
    en: 'Growth Arc (character evolves from weak/naive to strong/wise)'
  },
  'fall': {
    zh: '堕落型（角色从高处跌落或道德沦丧）',
    en: 'Fall Arc (character descends from grace or moral decline)'
  },
  'awakening': {
    zh: '觉醒型（角色意识到真相或找到使命）',
    en: 'Awakening Arc (character realizes truth or finds purpose)'
  },
  'redemption': {
    zh: '救赎型（角色弥补过错或重获新生）',
    en: 'Redemption Arc (character atones for mistakes or finds renewal)'
  },
  'exploration': {
    zh: '探索型（角色发现新世界或新自我）',
    en: 'Exploration Arc (character discovers new world or self)'
  }
};

/**
 * 悬念风格描述映射
 */
const suspenseStyleDescriptions: Record<string, { zh: string; en: string }> = {
  'opening': {
    zh: '开篇悬念（从第一幕就制造紧张感）',
    en: 'Opening Hook (create tension from the first act)'
  },
  'middle': {
    zh: '中段悬念（在故事中段引入关键谜团）',
    en: 'Mid-story Mystery (introduce key mystery in the middle)'
  },
  'multiple': {
    zh: '多重悬念（层层递进的多个悬念线）',
    en: 'Multiple Suspense (layered suspense threads)'
  },
  'none': {
    zh: '无悬念（平铺直叙的叙事风格）',
    en: 'No Suspense (straightforward narrative style)'
  }
};

/**
 * 构建 Plot 生成的 AI Prompt
 */
export function buildPlotPrompt(options: PlotGenerateOptions): string {
  const {
    prompt,
    complexity,
    mainCharacterCount,
    supportingCharacterCount,
    plotPointCount,
    subPlotCount,
    conflictTypes,
    emotionalArc,
    suspenseStyle,
    locale = 'en',
    genre,
    tone,
    perspective
  } = options;

  const isZh = locale === 'zh' || locale === 'zh-CN';
  const config = complexityConfig[complexity];
  const currentLanguage = languageNames[locale] || languageNames['en'];

  // 实际使用的情节点数量（允许用户自定义）
  const actualPlotPoints = plotPointCount || config.plotPoints;
  const actualChapters = complexity === 'complex' ? (config.chapters || 0) : 0;

  // 构建冲突类型描述
  const conflictDesc = conflictTypes.map(ct =>
    conflictTypeDescriptions[ct]?.[isZh ? 'zh' : 'en'] || ct
  ).join(', ');

  // 构建情感弧线描述
  const arcDesc = emotionalArcDescriptions[emotionalArc]?.[isZh ? 'zh' : 'en'] || emotionalArc;

  // 构建悬念风格描述
  const suspenseDesc = suspenseStyleDescriptions[suspenseStyle]?.[isZh ? 'zh' : 'en'] || suspenseStyle;

  if (isZh) {
    return `
为以下故事概念生成一个详细的故事大纲：**"${prompt}"**

# 故事结构要求

## 基本配置
- **复杂度级别**：${config.description.zh}
- **主要角色**：${mainCharacterCount} 位主角，${supportingCharacterCount} 位配角
- **情节点数量**：${actualPlotPoints} 个关键情节点
- **副线情节**：${subPlotCount} 条支线剧情
- **冲突类型**：${conflictDesc}
- **情感弧线**：${arcDesc}
- **悬念风格**：${suspenseDesc}
${genre ? `- **故事类型**：${genre}` : ''}
${tone ? `- **基调风格**：${tone}` : ''}
${perspective ? `- **叙事视角**：${perspective}` : ''}

## 输出格式（严格遵循以下 Markdown 结构）

### 故事标题
{为这个大纲创作一个吸引人的标题}

### 📖 故事梗概
{用 2-3 句话概括整个故事的核心内容，包括主要冲突和结局走向}

### 👥 主要角色
${mainCharacterCount > 0 ? `
**主角${mainCharacterCount > 1 ? '们' : ''}：**
${Array.from({ length: mainCharacterCount }, (_, i) => `
${i + 1}. **{角色名}** - {简短描述：性格特点、背景、动机}`).join('')}
` : ''}
${supportingCharacterCount > 0 ? `
**配角：**
${Array.from({ length: supportingCharacterCount }, (_, i) => `
${i + 1}. **{角色名}** - {简短描述：在故事中的作用}`).join('')}
` : ''}

### 🌟 主要情节点（${actualPlotPoints} 个）
${Array.from({ length: actualPlotPoints }, (_, i) => {
  const title = plotPointTitles[i] || { zh: `情节点 ${i + 1}` };
  return `
**${i + 1}. ${title.zh}**
- 发生了什么：{详细描述这个情节点的关键事件}
- 情感基调：{这个时刻的情绪氛围}
- 冲突与赌注：{角色面临什么风险或抉择}`;
}).join('\n')}

${subPlotCount > 0 ? `
### 🎭 副线情节（${subPlotCount} 条）
${Array.from({ length: subPlotCount }, (_, i) => `
**副线 ${i + 1}：{副线标题}**
- 与主线关联：{如何服务于或增强主线情节}
- 相关角色：{谁推动这条副线}
- 结局：{副线如何解决或收尾}`).join('\n')}
` : ''}

### 🎨 叙事弧线结构
- **开篇钩子**：{如何抓住读者注意力的开场方式}
- **触发事件**：{让故事开始运转的关键事件}
- **上升动作**：{紧张感如何逐步积累，角色如何应对挑战}
- **中点转折**：{故事中段的重大揭示或转变}
- **危机时刻**：{角色最黑暗/最脆弱的时刻}
- **高潮**：{最终对抗或关键抉择}
- **回落**：{高潮后的余波和后果}
- **结局**：{如何收尾，角色和世界的最终状态}

### ⛓️ 冲突架构
- **核心冲突**：${conflictDesc}
- **内在冲突示例**：{角色的内心挣扎具体表现}
- **外在冲突示例**：{外部障碍和对手的具体表现}
- **冲突升级方式**：{冲突如何层层递进}

### 🎪 悬念与张力
- **悬念类型**：${suspenseDesc}
- **关键悬念点**：{在故事的哪些时刻制造悬念}
- **伏笔与暗示**：{如何埋下线索和预示}
- **意外转折**：{计划中的惊喜时刻}

${actualChapters > 0 ? `
### 📚 章节大纲（${actualChapters} 章）
${Array.from({ length: actualChapters }, (_, i) => `
**第 ${i + 1} 章**
- 章节标题：{吸引人的章节名}
- 关键事件：{本章发生的主要情节}
- 叙事视角：{从谁的角度叙述}
- 目标字数：${1500 + Math.floor(i * 200)} 字
- 本章目的：{推进情节的哪个部分}`).join('\n')}
` : ''}

---

**重要指示：**
1. 输出必须严格遵循上述 Markdown 格式
2. 所有内容必须用**${currentLanguage.native}**撰写
3. 不要添加任何额外的解释或评论
4. 大纲应该详细且具有可操作性，足以指导后续的故事创作
5. 确保情节的逻辑连贯性和情感真实性
`.trim();
  } else {
    // English prompt
    return `
Generate a detailed story outline for the following concept: **"${prompt}"**

# Story Structure Requirements

## Configuration
- **Complexity Level**: ${config.description.en}
- **Main Characters**: ${mainCharacterCount} protagonist(s), ${supportingCharacterCount} supporting character(s)
- **Plot Points**: ${actualPlotPoints} key plot points
- **Subplots**: ${subPlotCount} subplot(s)
- **Conflict Types**: ${conflictDesc}
- **Emotional Arc**: ${arcDesc}
- **Suspense Style**: ${suspenseDesc}
${genre ? `- **Genre**: ${genre}` : ''}
${tone ? `- **Tone**: ${tone}` : ''}
${perspective ? `- **Perspective**: ${perspective}` : ''}

## Output Format (Strictly Follow This Markdown Structure)

### Story Title
{Create an engaging title for this outline}

### 📖 Synopsis
{Summarize the entire story in 2-3 sentences, including the main conflict and resolution direction}

### 👥 Main Characters
${mainCharacterCount > 0 ? `
**Protagonist${mainCharacterCount > 1 ? 's' : ''}:**
${Array.from({ length: mainCharacterCount }, (_, i) => `
${i + 1}. **{Character Name}** - {Brief description: personality traits, background, motivation}`).join('')}
` : ''}
${supportingCharacterCount > 0 ? `
**Supporting Characters:**
${Array.from({ length: supportingCharacterCount }, (_, i) => `
${i + 1}. **{Character Name}** - {Brief description: role in the story}`).join('')}
` : ''}

### 🌟 Main Plot Points (${actualPlotPoints})
${Array.from({ length: actualPlotPoints }, (_, i) => {
  const title = plotPointTitles[i] || { en: `Plot Point ${i + 1}` };
  return `
**${i + 1}. ${title.en}**
- What Happens: {Detailed description of the key events at this plot point}
- Emotional Tone: {The mood/atmosphere at this moment}
- Stakes & Conflict: {What risks or choices does the character face}`;
}).join('\n')}

${subPlotCount > 0 ? `
### 🎭 Subplots (${subPlotCount})
${Array.from({ length: subPlotCount }, (_, i) => `
**Subplot ${i + 1}: {Subplot Title}**
- Connection to Main Plot: {How it serves or enhances the main storyline}
- Characters Involved: {Who drives this subplot}
- Resolution: {How this subplot concludes}`).join('\n')}
` : ''}

### 🎨 Narrative Arc Structure
- **Opening Hook**: {How to grab reader attention at the start}
- **Inciting Incident**: {The key event that sets the story in motion}
- **Rising Action**: {How tension builds and characters face challenges}
- **Midpoint Shift**: {Major revelation or change at the story's midpoint}
- **Crisis Moment**: {The character's darkest/most vulnerable moment}
- **Climax**: {The final confrontation or critical decision}
- **Falling Action**: {Aftermath and consequences following the climax}
- **Resolution**: {How it ends, final state of characters and world}

### ⛓️ Conflict Architecture
- **Core Conflict**: ${conflictDesc}
- **Internal Conflict Examples**: {Specific manifestations of character's inner struggles}
- **External Conflict Examples**: {Specific obstacles and antagonistic forces}
- **Conflict Escalation**: {How conflicts intensify progressively}

### 🎪 Suspense & Tension
- **Suspense Type**: ${suspenseDesc}
- **Key Suspense Points**: {When in the story to create suspense}
- **Foreshadowing**: {How to plant clues and hints}
- **Unexpected Twists**: {Planned surprise moments}

${actualChapters > 0 ? `
### 📚 Chapter Outline (${actualChapters} Chapters)
${Array.from({ length: actualChapters }, (_, i) => `
**Chapter ${i + 1}**
- Chapter Title: {Engaging chapter name}
- Key Events: {Main plot developments in this chapter}
- Narrative POV: {From whose perspective}
- Target Word Count: ${1500 + Math.floor(i * 200)} words
- Chapter Purpose: {Which part of the plot does it advance}`).join('\n')}
` : ''}

---

**IMPORTANT INSTRUCTIONS:**
1. Output MUST strictly follow the above Markdown format
2. All content MUST be written in **${currentLanguage.english}**
3. Do NOT add any extra explanations or commentary
4. The outline should be detailed and actionable enough to guide subsequent story writing
5. Ensure logical coherence and emotional authenticity
`.trim();
  }
}

/**
 * 从生成的内容中提取标题
 */
export function extractPlotTitle(content: string): string {
  // 尝试匹配 Markdown 标题
  const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^###?\s*故事标题\s*\n+(.+)$/m) || content.match(/^###?\s*Story Title\s*\n+(.+)$/m);

  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim().replace(/[#*]/g, '').trim();
  }

  // 如果找不到标题，从内容的前50个字符生成
  return content.substring(0, 50).replace(/[#*\n]/g, ' ').trim() + '...';
}

/**
 * 计算 Plot 内容的字数（支持中英文）
 */
export function countPlotWords(content: string): number {
  // 移除 Markdown 标记
  const plainText = content.replace(/[#*`\[\]()]/g, '');

  // 中文字符数
  const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g) || [];

  // 英文单词数
  const englishWords = plainText
    .replace(/[\u4e00-\u9fa5]/g, '')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  return chineseChars.length + englishWords.length;
}
