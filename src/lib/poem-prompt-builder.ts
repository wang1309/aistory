/**
 * Poem Generator AI Prompt 工程
 * 根据用户参数构建结构化的 Poem 生成 Prompt
 */

import type { PoemGenerateOptions } from '@/types/poem';

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
 * 诗歌类型描述映射
 */
const poemTypeDescriptions: Record<string, { zh: string; en: string }> = {
  'modern': {
    zh: '现代诗（自由诗）- 不受格律限制，注重意象和情感表达',
    en: 'Modern Poetry (Free Verse) - No formal constraints, focus on imagery and emotional expression'
  },
  'classical': {
    zh: '古典诗词 - 遵守传统格律、平仄、押韵规则',
    en: 'Classical Poetry - Follow traditional prosody, tonal patterns, and rhyme schemes'
  },
  'format': {
    zh: '特定格式诗 - 遵守固定的格式要求（如俳句、十四行诗等）',
    en: 'Format Poetry - Adhere to specific format requirements (haiku, sonnet, etc.)'
  },
  'lyric': {
    zh: '歌词风格 - 类似流行歌曲的韵律和结构',
    en: 'Lyric Style - Rhythm and structure similar to popular songs'
  }
};

/**
 * 长度配置映射
 */
const lengthConfig: Record<string, { zh: string; en: string; lines: string }> = {
  'short': {
    zh: '短诗（4-8行）',
    en: 'Short poem (4-8 lines)',
    lines: '4-8'
  },
  'medium': {
    zh: '中篇诗（12-20行）',
    en: 'Medium poem (12-20 lines)',
    lines: '12-20'
  },
  'long': {
    zh: '长诗（20行以上）',
    en: 'Long poem (20+ lines)',
    lines: '20+'
  }
};

/**
 * 韵律方案描述映射
 */
const rhymeSchemeDescriptions: Record<string, { zh: string; en: string }> = {
  'free': { zh: '自由韵律', en: 'Free rhyme' },
  'abab': { zh: 'ABAB 交叉韵', en: 'ABAB alternate rhyme' },
  'aabb': { zh: 'AABB 对偶韵', en: 'AABB couplet rhyme' },
  'abcb': { zh: 'ABCB 简单韵', en: 'ABCB simple rhyme' },
  '五言绝句': { zh: '五言绝句（20字，平仄严格）', en: '5-character quatrain (strict tonal pattern)' },
  '七言绝句': { zh: '七言绝句（28字，平仄严格）', en: '7-character quatrain (strict tonal pattern)' },
  '五言律诗': { zh: '五言律诗（40字，8句）', en: '5-character regulated verse (40 chars, 8 lines)' },
  '七言律诗': { zh: '七言律诗（56字，8句）', en: '7-character regulated verse (56 chars, 8 lines)' },
  'haiku': { zh: '俳句（5-7-5音节）', en: 'Haiku (5-7-5 syllable pattern)' },
  'free_verse': { zh: '自由诗（无固定格式）', en: 'Free Verse (no fixed structure)' },
  'sonnet': { zh: '十四行诗（14行，固定韵律）', en: 'Sonnet (14 lines, fixed rhyme scheme)' },
  'limerick': { zh: '打油诗（5行，AABBA韵）', en: 'Limerick (5 lines, AABBA rhyme)' },
  'acrostic': { zh: '藏头诗（首字藏字）', en: 'Acrostic (first letters spell a word)' },
  'love_poem': { zh: '情诗（表达爱意）', en: 'Love Poem (expressing romantic feelings)' },
  'line_by_line': { zh: '逐行诗（每行独立意象）', en: 'Line by Line (each line stands alone)' },
  'rhyming_couplets': { zh: '对联/押韵对句（两行一组）', en: 'Rhyming Couplets (pairs of rhyming lines)' },
  'villanelle': { zh: '维拉内拉（19行，固定重复）', en: 'Villanelle (19 lines with fixed repetition)' },
  'verse_chorus': { zh: '主歌+副歌结构', en: 'Verse-Chorus structure' },
  'verse_bridge_chorus': { zh: '主歌+过渡+副歌结构', en: 'Verse-Bridge-Chorus structure' }
};

/**
 * 主题描述映射
 */
const themeDescriptions: Record<string, { zh: string; en: string }> = {
  'love': { zh: '爱情', en: 'Love' },
  'nature': { zh: '自然', en: 'Nature' },
  'philosophy': { zh: '哲理', en: 'Philosophy' },
  'inspiration': { zh: '励志', en: 'Inspiration' },
  'life': { zh: '人生', en: 'Life' },
  'nostalgia': { zh: '怀旧', en: 'Nostalgia' },
  'friendship': { zh: '友谊', en: 'Friendship' },
  'family': { zh: '亲情', en: 'Family' },
  'society': { zh: '社会', en: 'Society' },
  'history': { zh: '历史', en: 'History' }
};

/**
 * 情感描述映射
 */
const moodDescriptions: Record<string, { zh: string; en: string }> = {
  'joyful': { zh: '欢快', en: 'Joyful' },
  'melancholic': { zh: '忧郁', en: 'Melancholic' },
  'passionate': { zh: '激昂', en: 'Passionate' },
  'peaceful': { zh: '平静', en: 'Peaceful' },
  'romantic': { zh: '浪漫', en: 'Romantic' },
  'contemplative': { zh: '沉思', en: 'Contemplative' },
  'hopeful': { zh: '充满希望', en: 'Hopeful' },
  'sorrowful': { zh: '悲伤', en: 'Sorrowful' }
};

/**
 * 风格描述映射
 */
const styleDescriptions: Record<string, { zh: string; en: string }> = {
  'romantic': { zh: '浪漫主义', en: 'Romanticism' },
  'realism': { zh: '现实主义', en: 'Realism' },
  'symbolism': { zh: '象征主义', en: 'Symbolism' },
  'surrealism': { zh: '超现实主义', en: 'Surrealism' },
  'minimalism': { zh: '极简主义', en: 'Minimalism' },
  'impressionism': { zh: '意象派', en: 'Impressionism' },
  'modernism': { zh: '现代主义', en: 'Modernism' },
  'classical': { zh: '古典主义', en: 'Classicism' }
};

/**
 * 构建现代诗 Prompt
 */
function buildModernPoemPrompt(options: PoemGenerateOptions, isZh: boolean): string {
  const { prompt, length, rhymeScheme, theme, mood, style, locale } = options;
  const lengthDesc = lengthConfig[length];
  const rhymeDesc = rhymeScheme ? rhymeSchemeDescriptions[rhymeScheme] : null;
  const themeDesc = theme ? themeDescriptions[theme] : null;
  const moodDesc = mood ? moodDescriptions[mood] : null;
  const styleDesc = style ? styleDescriptions[style] : null;
  const lang = languageNames[locale] || languageNames['en'];

  if (isZh) {
    return `你是一位富有创造力的现代诗人。请根据以下要求创作一首现代诗：

**主题/灵感**：${prompt}

**诗歌要求**：
- 类型：现代诗（自由诗）
- 长度：${lengthDesc.zh}
${rhymeDesc ? `- 韵律：${rhymeDesc.zh}` : ''}
${themeDesc ? `- 主题：${themeDesc.zh}` : ''}
${moodDesc ? `- 情感基调：${moodDesc.zh}` : ''}
${styleDesc ? `- 文学风格：${styleDesc.zh}` : ''}
- 输出语言：${lang.native} (${lang.english})

**创作指导**：
1. 注重意象的选择和运用，创造鲜明的画面感
2. 关注情感的细腻表达和情绪的渐进变化
3. 使用恰当的修辞手法（比喻、拟人、排比等）
4. 保持语言的节奏感和音乐性
${rhymeDesc ? `5. 遵守 ${rhymeDesc.zh} 的韵律规则` : '5. 自由发挥韵律，但保持整体和谐'}
6. 避免陈词滥调，追求新颖独特的表达

请直接输出诗歌内容，不要添加任何解释或额外说明。`;
  } else {
    return `You are a creative modern poet. Please compose a modern poem based on the following requirements:

**Theme/Inspiration**: ${prompt}

**Poem Requirements**:
- Type: Modern Poetry (Free Verse)
- Length: ${lengthDesc.en}
${rhymeDesc ? `- Rhyme Scheme: ${rhymeDesc.en}` : ''}
${themeDesc ? `- Theme: ${themeDesc.en}` : ''}
${moodDesc ? `- Emotional Tone: ${moodDesc.en}` : ''}
${styleDesc ? `- Literary Style: ${styleDesc.en}` : ''}
- Output Language: ${lang.native} (${lang.english})

**Creative Guidelines**:
1. Focus on imagery selection and usage, creating vivid visual impressions
2. Pay attention to nuanced emotional expression and progressive mood changes
3. Use appropriate rhetorical devices (metaphor, personification, parallelism, etc.)
4. Maintain rhythmic flow and musicality in language
${rhymeDesc ? `5. Follow the ${rhymeDesc.en} pattern` : '5. Freely develop rhythm while maintaining overall harmony'}
6. Avoid clichés and pursue novel, unique expressions

Output the poem directly without any explanations or additional comments.`;
  }
}

/**
 * 构建古典诗词 Prompt
 */
function buildClassicalPoemPrompt(options: PoemGenerateOptions, isZh: boolean): string {
  const { prompt, rhymeScheme, theme, mood, classicalOptions, locale } = options;
  const form = rhymeScheme || classicalOptions?.form || '七言绝句';
  const cipaiName = classicalOptions?.cipaiName;
  const strictTone = classicalOptions?.strictTone !== false;
  const themeDesc = theme ? themeDescriptions[theme] : null;
  const moodDesc = mood ? moodDescriptions[mood] : null;
  const lang = languageNames[locale] || languageNames['zh'];

  if (isZh) {
    return `你是一位精通中国古典诗词的诗人。请根据以下要求创作一首古典诗词：

**主题/灵感**：${prompt}

**诗词要求**：
- 体裁：${form}
${cipaiName ? `- 词牌：${cipaiName}` : ''}
${themeDesc ? `- 主题：${themeDesc.zh}` : ''}
${moodDesc ? `- 情感基调：${moodDesc.zh}` : ''}
- 平仄要求：${strictTone ? '严格遵守平仄规则' : '可适当放宽平仄要求'}
- 输出语言：${lang.native} (${lang.english})

**创作指导**：
1. 严格遵守所选体裁的格律要求（字数、句数、对仗等）
2. ${strictTone ? '严格遵守平仄规则，确保音律和谐' : '注意平仄协调，但可适当变通'}
3. 押韵准确，韵脚选择恰当
4. 注重意境的营造，追求含蓄深远的艺术效果
5. 运用传统的意象和典故，但要化用得当
6. 语言凝练，一字千金，避免冗余
7. 讲究对仗工整（律诗和部分词牌）

请直接输出诗词内容，不要添加任何解释或额外说明。${form.includes('词') ? '词作需标注词牌名。' : ''}`;
  } else {
    return `You are a poet skilled in classical Chinese poetry. Please compose a classical Chinese poem based on the following requirements:

**Theme/Inspiration**: ${prompt}

**Poem Requirements**:
- Form: ${form} (Classical Chinese poetry form)
${cipaiName ? `- Cipai (Tune Pattern): ${cipaiName}` : ''}
${themeDesc ? `- Theme: ${themeDesc.en}` : ''}
${moodDesc ? `- Emotional Tone: ${moodDesc.en}` : ''}
- Tonal Pattern: ${strictTone ? 'Strictly follow tonal rules' : 'Tonal rules can be relaxed'}
- Output Language: ${lang.native} (${lang.english})

**Creative Guidelines**:
1. Strictly follow the format requirements (character count, line count, parallelism, etc.)
2. ${strictTone ? 'Strictly adhere to tonal patterns for harmonic sound' : 'Pay attention to tonal coordination but allow flexibility'}
3. Ensure accurate rhyming with appropriate rhyme selection
4. Focus on creating artistic conception with subtle and profound effects
5. Use traditional imagery and allusions appropriately
6. Keep language concise and meaningful, avoid redundancy
7. Ensure parallelism in couplets (for regulated verse and some cipai forms)

Output the poem directly without any explanations or additional comments.${form.includes('词') || form.includes('Ci') ? ' For ci poetry, include the cipai name.' : ''}`;
  }
}

/**
 * 构建特定格式诗 Prompt
 */
function buildFormatPoemPrompt(options: PoemGenerateOptions, isZh: boolean): string {
  const { prompt, rhymeScheme, theme, mood, locale } = options;
  const format = rhymeScheme || 'haiku';
  const formatDesc = rhymeSchemeDescriptions[format];
  const themeDesc = theme ? themeDescriptions[theme] : null;
  const moodDesc = mood ? moodDescriptions[mood] : null;
  const lang = languageNames[locale] || languageNames['en'];

  if (isZh) {
    return `你是一位精通各种诗歌格式的诗人。请根据以下要求创作一首特定格式的诗歌：

**主题/灵感**：${prompt}

**诗歌要求**：
- 格式：${formatDesc.zh}
${themeDesc ? `- 主题：${themeDesc.zh}` : ''}
${moodDesc ? `- 情感基调：${moodDesc.zh}` : ''}
- 输出语言：${lang.native} (${lang.english})

**格式要求**：
${format === 'haiku' ? `- 严格遵守5-7-5音节模式
- 必须包含季节意象（季语）
- 展现自然景观和瞬间感悟
- 语言简洁凝练` : ''}
${format === 'sonnet' ? `- 14行诗，通常为10音节/行
- 遵循固定韵律（如ABAB CDCD EFEF GG）
- 前8行提出问题/情景，后6行转折/解决
- 语言优雅精致` : ''}
${format === 'limerick' ? `- 5行打油诗
- 韵律为AABBA
- 节奏轻快幽默
- 第1、2、5行较长，第3、4行较短` : ''}
${format === 'acrostic' ? `- 每行首字连起来组成一个词或短语
- 整体保持诗歌的流畅性和意义
- 不要为了藏字而牺牲诗意` : ''}

请直接输出诗歌内容，不要添加任何解释或额外说明。`;
  } else {
    return `You are a poet skilled in various poetic forms. Please compose a poem in a specific format based on the following requirements:

**Theme/Inspiration**: ${prompt}

**Poem Requirements**:
- Format: ${formatDesc.en}
${themeDesc ? `- Theme: ${themeDesc.en}` : ''}
${moodDesc ? `- Emotional Tone: ${moodDesc.en}` : ''}
- Output Language: ${lang.native} (${lang.english})

**Format Requirements**:
${format === 'haiku' ? `- Strictly follow 5-7-5 syllable pattern
- Must include seasonal imagery (kigo)
- Present natural scenery and momentary insight
- Keep language concise and refined` : ''}
${format === 'sonnet' ? `- 14 lines, typically 10 syllables per line
- Follow fixed rhyme scheme (e.g., ABAB CDCD EFEF GG)
- First 8 lines present problem/situation, last 6 lines turn/resolve
- Use elegant and refined language` : ''}
${format === 'limerick' ? `- 5-line humorous poem
- AABBA rhyme scheme
- Light and playful rhythm
- Lines 1, 2, 5 are longer; lines 3, 4 are shorter` : ''}
${format === 'acrostic' ? `- First letters of each line spell a word or phrase
- Maintain overall fluency and meaning
- Don't sacrifice poetic quality for the acrostic` : ''}

Output the poem directly without any explanations or additional comments.`;
  }
}

/**
 * 构建歌词风格 Prompt
 */
function buildLyricPoemPrompt(options: PoemGenerateOptions, isZh: boolean): string {
  const { prompt, rhymeScheme, theme, mood, style, locale } = options;
  const structure = rhymeScheme || 'verse_chorus';
  const structureDesc = rhymeSchemeDescriptions[structure];
  const themeDesc = theme ? themeDescriptions[theme] : null;
  const moodDesc = mood ? moodDescriptions[mood] : null;
  const styleDesc = style ? styleDescriptions[style] : null;
  const lang = languageNames[locale] || languageNames['en'];

  if (isZh) {
    return `你是一位富有才华的作词人。请根据以下要求创作一首歌词：

**主题/灵感**：${prompt}

**歌词要求**：
- 结构：${structureDesc.zh}
${themeDesc ? `- 主题：${themeDesc.zh}` : ''}
${moodDesc ? `- 情感基调：${moodDesc.zh}` : ''}
${styleDesc ? `- 风格：${styleDesc.zh}` : ''}
- 输出语言：${lang.native} (${lang.english})

**创作指导**：
1. 副歌部分要朗朗上口，容易记忆
2. 注重节奏感和韵律，适合演唱
3. 语言简洁直接，避免过于文学化
4. 主歌讲述故事或展开情境，副歌提炼核心情感
${structure === 'verse_bridge_chorus' ? '5. 过渡段（Bridge）提供情感转折或新的视角' : ''}
${structure === 'verse_chorus' ? '5. 主歌和副歌形成对比和呼应' : ''}
6. 使用日常化的语言，但保持诗意
7. 重复和变奏要恰到好处

**结构标注**：
请在输出时标注各部分：
- [主歌] 或 [Verse]
${structure === 'verse_bridge_chorus' ? '- [过渡] 或 [Bridge]' : ''}
- [副歌] 或 [Chorus]

请直接输出歌词内容，按结构分段标注。`;
  } else {
    return `You are a talented lyricist. Please compose song lyrics based on the following requirements:

**Theme/Inspiration**: ${prompt}

**Lyrics Requirements**:
- Structure: ${structureDesc.en}
${themeDesc ? `- Theme: ${themeDesc.en}` : ''}
${moodDesc ? `- Emotional Tone: ${moodDesc.en}` : ''}
${styleDesc ? `- Style: ${styleDesc.en}` : ''}
- Output Language: ${lang.native} (${lang.english})

**Creative Guidelines**:
1. Chorus should be catchy and memorable
2. Focus on rhythm and flow, suitable for singing
3. Use simple, direct language; avoid overly literary expressions
4. Verses tell the story or set the scene, chorus distills core emotion
${structure === 'verse_bridge_chorus' ? '5. Bridge provides emotional turn or new perspective' : ''}
${structure === 'verse_chorus' ? '5. Verses and chorus create contrast and resonance' : ''}
6. Use everyday language while maintaining poetic quality
7. Balance repetition and variation appropriately

**Structure Labels**:
Please label each section in the output:
- [Verse]
${structure === 'verse_bridge_chorus' ? '- [Bridge]' : ''}
- [Chorus]

Output the lyrics directly with section labels.`;
  }
}

/**
 * 构建 Poem 生成的 AI Prompt
 */
export function buildPoemPrompt(options: PoemGenerateOptions): string {
  const { poemType, locale } = options;
  const isZh = locale === 'zh' || locale === 'zh-CN' || locale === 'zh-TW';

  switch (poemType) {
    case 'modern':
      return buildModernPoemPrompt(options, isZh);
    case 'classical':
      return buildClassicalPoemPrompt(options, isZh);
    case 'format':
      return buildFormatPoemPrompt(options, isZh);
    case 'lyric':
      return buildLyricPoemPrompt(options, isZh);
    default:
      return buildModernPoemPrompt(options, isZh);
  }
}

/**
 * 构建诗歌分析 Prompt
 */
export function buildPoemAnalysisPrompt(poemContent: string, poemType: string, locale: string): string {
  const isZh = locale === 'zh' || locale === 'zh-CN' || locale === 'zh-TW';
  const lang = languageNames[locale] || languageNames['en'];

  if (isZh) {
    return `你是一位资深的诗歌评论家和文学分析师。请对以下诗歌进行深入分析：

**诗歌内容**：
${poemContent}

**诗歌类型**：${poemTypeDescriptions[poemType]?.zh || poemType}

请从以下维度进行分析，并以JSON格式输出：

{
  "imagery": [{"image": "意象1", "significance": "象征意义"}, {"image": "意象2", "significance": "象征意义"}],
  "rhymeAnalysis": "韵律和音韵分析（包括押韵方式、音节结构等）",
  "rhetoricalDevices": ["修辞手法1", "修辞手法2"],
  "emotionalTone": "情感基调分析",
  "themeInterpretation": "主题和深层含义解读"
}

**分析要求**：
1. imagery：提取诗中的核心意象，分析其象征意义
2. rhymeAnalysis：分析韵律结构、押韵方式、音节模式
3. rhetoricalDevices：识别使用的修辞手法（比喻、拟人、排比、对比等）
4. emotionalTone：分析整体情感基调和情绪变化
5. themeInterpretation：解读诗歌的主题思想和哲学内涵

请用${lang.native}输出分析结果，确保JSON格式正确。`;
  } else {
    return `You are an experienced poetry critic and literary analyst. Please provide an in-depth analysis of the following poem:

**Poem Content**:
${poemContent}

**Poem Type**: ${poemTypeDescriptions[poemType]?.en || poemType}

Please analyze from the following dimensions and output in JSON format:

{
  "imagery": [{"image": "imagery1", "significance": "symbolic meaning"}, {"image": "imagery2", "significance": "symbolic meaning"}],
  "rhymeAnalysis": "Rhyme and sound analysis (including rhyme scheme, syllable structure, etc.)",
  "rhetoricalDevices": ["device1", "device2"],
  "emotionalTone": "Emotional tone analysis",
  "themeInterpretation": "Theme and deeper meaning interpretation"
}

**Analysis Requirements**:
1. imagery: Extract core imagery and analyze symbolic significance
2. rhymeAnalysis: Analyze rhythmic structure, rhyme scheme, syllable patterns
3. rhetoricalDevices: Identify rhetorical devices used (metaphor, personification, parallelism, contrast, etc.)
4. emotionalTone: Analyze overall emotional tone and mood changes
5. themeInterpretation: Interpret thematic ideas and philosophical implications

Output the analysis in ${lang.native}, ensuring correct JSON format.`;
  }
}
