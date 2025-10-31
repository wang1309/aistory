import { respErr } from '@/lib/resp';

export const runtime = 'edge';

/**
 * Verify Cloudflare Turnstile token
 */
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  console.log('=== Turnstile Verification Debug (Fanfic Gen) ===');
  console.log('Token received:', token ? `Present (${token.length} chars)` : 'Missing');
  console.log('Secret key configured:', secretKey ? 'Yes' : 'No');

  if (!secretKey) {
    console.log('TURNSTILE_SECRET_KEY is not configured');
    return false;
  }

  try {
    const requestBody = {
      secret: secretKey,
      response: token,
    };

    console.log('Sending verification request to Cloudflare...');

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();
    console.log('Cloudflare response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✓ Verification successful');
    } else {
      console.log('✗ Verification failed');
      console.log('Error codes:', data['error-codes']);
    }

    return data.success === true;
  } catch (error) {
    console.log('Turnstile verification error:', error);
    return false;
  }
}

/**
 * Build the system prompt for fanfic generation
 */
function buildSystemPrompt(locale: string): string {
  if (locale === 'zh' || locale === 'zh-CN') {
    return `你是一位专业的同人文作家，擅长创作高质量的同人小说。你的写作特点：

1. 忠实原作：深入理解原作角色性格、世界观和设定
2. 情感细腻：擅长刻画角色的内心世界和情感变化
3. 情节紧凑：故事节奏把握得当，情节发展自然流畅
4. 文笔优美：语言生动，描写细致，富有感染力
5. 尊重设定：在保留原作精髓的基础上进行合理创新

创作时请注意：
- 保持角色的性格特征和说话方式
- 情节发展要合理，符合逻辑
- 注重细节描写和氛围营造
- 对话要生动自然，富有个性
- 结构完整，有开头、发展、高潮和结尾`;
  }

  return `You are a professional fanfiction writer specializing in creating high-quality fan stories. Your writing characteristics:

1. Canon Faithful: Deep understanding of original character personalities, worldviews, and settings
2. Emotionally Nuanced: Skilled at depicting characters' inner worlds and emotional changes
3. Well-Paced: Good grasp of story rhythm with natural plot development
4. Eloquent Writing: Vivid language, detailed descriptions, and compelling narrative
5. Respectful of Canon: Reasonable innovation while preserving the essence of the original work

When writing, please note:
- Maintain character traits and speaking patterns
- Plot development should be reasonable and logical
- Focus on detailed descriptions and atmosphere building
- Dialogue should be lively, natural, and distinctive
- Complete structure with beginning, development, climax, and ending`;
}

/**
 * Build the user prompt for fanfic generation
 */
function buildUserPrompt(data: any, locale: string): string {
  const {
    source,
    pairing,
    plotType,
    prompt,
    options,
    outputLanguage
  } = data;

  // Map plot types
  const plotTypeMap: Record<string, any> = {
    'canon': locale === 'zh' ? '原著向' : 'Canon-compliant',
    'modern_au': locale === 'zh' ? '现代AU' : 'Modern AU',
    'school_au': locale === 'zh' ? '校园AU' : 'School AU',
    'fantasy_au': locale === 'zh' ? '奇幻AU' : 'Fantasy AU',
    'crossover': locale === 'zh' ? '跨界' : 'Crossover'
  };

  // Build the prompt
  let userPrompt = locale === 'zh' ? '请创作一篇同人小说，要求如下：\n\n' : 'Please write a fanfiction with the following requirements:\n\n';

  // Source work
  userPrompt += locale === 'zh' ? `【原作品】${source.name}\n` : `【Source Work】${source.name}\n`;
  if (source.worldview) {
    userPrompt += locale === 'zh' ? `世界观：${source.worldview}\n` : `Worldview: ${source.worldview}\n`;
  }

  // Characters
  if (source.characters && source.characters.length > 0) {
    userPrompt += locale === 'zh' ? `主要角色：${source.characters.join('、')}\n` : `Main Characters: ${source.characters.join(', ')}\n`;
  }

  // Pairing
  userPrompt += '\n';
  const pairingTypeMap: Record<string, any> = {
    'romantic': locale === 'zh' ? '浪漫向' : 'Romantic',
    'gen': locale === 'zh' ? '单人中心向' : 'Gen',
    'poly': locale === 'zh' ? '多人配对' : 'Poly'
  };
  userPrompt += locale === 'zh'
    ? `【CP配对】${pairingTypeMap[pairing.type]}：${pairing.characters.join(' × ')}\n`
    : `【Pairing】${pairingTypeMap[pairing.type]}: ${pairing.characters.join(' × ')}\n`;

  // Plot type
  userPrompt += locale === 'zh'
    ? `【剧情类型】${plotTypeMap[plotType] || plotType}\n`
    : `【Plot Type】${plotTypeMap[plotType] || plotType}\n`;

  // Story prompt
  userPrompt += '\n';
  userPrompt += locale === 'zh' ? `【故事提示】\n${prompt}\n` : `【Story Prompt】\n${prompt}\n`;

  // Advanced options
  if (options) {
    userPrompt += '\n';
    userPrompt += locale === 'zh' ? '【创作要求】\n' : '【Writing Requirements】\n';

    // OOC level
    if (options.ooc && options.ooc !== 'none') {
      const oocMap: Record<string, any> = {
        'canon_compliant': locale === 'zh' ? '完全符合原著，不允许OOC' : 'Strictly canon-compliant, no OOC',
        'slight_ooc': locale === 'zh' ? '允许轻微OOC，保持角色核心特质' : 'Slight OOC allowed, maintain core traits',
        'bold_adaptation': locale === 'zh' ? '可以大胆改编，创造新的角色面貌' : 'Bold adaptation allowed, create new character facets'
      };
      if (oocMap[options.ooc]) {
        userPrompt += `- ${locale === 'zh' ? 'OOC程度' : 'OOC Level'}: ${oocMap[options.ooc]}\n`;
      }
    }

    // Fidelity
    if (options.fidelity && options.fidelity !== 'none') {
      const fidelityMap: Record<string, any> = {
        'high_fidelity': locale === 'zh' ? '高度还原原作设定和氛围' : 'High fidelity to original settings and atmosphere',
        'moderate': locale === 'zh' ? '适度创新，保持原作风格' : 'Moderate innovation, maintain original style',
        'original': locale === 'zh' ? '大胆创新，仅保留角色和基本设定' : 'Bold innovation, retain only characters and basic settings'
      };
      if (fidelityMap[options.fidelity]) {
        userPrompt += `- ${locale === 'zh' ? '原作还原度' : 'Canon Fidelity'}: ${fidelityMap[options.fidelity]}\n`;
      }
    }

    // Ending
    if (options.ending && options.ending !== 'none') {
      const endingMap: Record<string, any> = {
        'happy': locale === 'zh' ? 'Happy Ending（圆满结局）' : 'Happy Ending',
        'sad': locale === 'zh' ? 'Bad Ending（悲剧结局）' : 'Bad Ending',
        'open': locale === 'zh' ? 'Open Ending（开放式结局）' : 'Open Ending'
      };
      if (endingMap[options.ending]) {
        userPrompt += `- ${locale === 'zh' ? '情节走向' : 'Ending Type'}: ${endingMap[options.ending]}\n`;
      }
    }

    // Rating
    if (options.rating && options.rating !== 'none') {
      const ratingMap: Record<string, any> = {
        'general': locale === 'zh' ? '全年龄向，内容健康向上' : 'General audiences, family-friendly content',
        'teen': locale === 'zh' ? '青少年向，可含轻度暴力或情感冲突' : 'Teen audiences, mild violence or emotional conflict allowed',
        'mature': locale === 'zh' ? '成人向，可含成熟主题' : 'Mature audiences, mature themes allowed',
        'explicit': locale === 'zh' ? '限制级，可含明确成人内容' : 'Explicit content allowed'
      };
      if (ratingMap[options.rating]) {
        userPrompt += `- ${locale === 'zh' ? '内容分级' : 'Content Rating'}: ${ratingMap[options.rating]}\n`;
      }
    }

    // Length
    if (options.length && options.length !== 'none') {
      const lengthMap: Record<string, any> = {
        'short': locale === 'zh' ? '短篇（300-500字）' : 'Short (300-500 words)',
        'medium': locale === 'zh' ? '中篇（500-1000字）' : 'Medium (500-1000 words)',
        'long': locale === 'zh' ? '长篇（1000-1500字）' : 'Long (1000-1500 words)',
        'extend': locale === 'zh' ? '加长（1500-2000字）' : 'Extended (1500-2000 words)',
        'epic_short': locale === 'zh' ? '超长（2000-2500字）' : 'Epic Short (2000-2500 words)',
        'novella_lite': locale === 'zh' ? '小说（2500-3000字）' : 'Novella (2500-3000 words)'
      };
      if (lengthMap[options.length]) {
        userPrompt += `- ${locale === 'zh' ? '故事长度' : 'Story Length'}: ${lengthMap[options.length]}\n`;
      }
    }

    // Perspective
    if (options.perspective && options.perspective !== 'none') {
      const perspectiveMap: Record<string, any> = {
        'first_person': locale === 'zh' ? '第一人称（我）' : 'First Person (I)',
        'second_person': locale === 'zh' ? '第二人称（你）' : 'Second Person (You)',
        'third_person_limited': locale === 'zh' ? '第三人称限制视角' : 'Third Person Limited',
        'third_person_omniscient': locale === 'zh' ? '第三人称全知视角' : 'Third Person Omniscient'
      };
      if (perspectiveMap[options.perspective]) {
        userPrompt += `- ${locale === 'zh' ? '叙事视角' : 'Narrative Perspective'}: ${perspectiveMap[options.perspective]}\n`;
      }
    }
  }

  // Output language
  userPrompt += '\n';
  const languageNames: Record<string, any> = {
    'zh': '中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'de': 'Deutsch',
    'fr': 'Français',
    'es': 'Español',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский'
  };
  userPrompt += locale === 'zh'
    ? `请用${languageNames[outputLanguage] || outputLanguage}创作这篇同人小说。\n`
    : `Please write this fanfiction in ${languageNames[outputLanguage] || outputLanguage}.\n`;

  return userPrompt;
}

/**
 * Select model based on user choice
 */
function selectModel(modelChoice: string): string {
  const modelMap: Record<string, string> = {
    'fast': 'gemini-2.5-flash-lite',      // 角色还原 - 快速
    'standard': 'gemini-2.5-flash',       // 创意改编 - 推荐
    'creative': 'gemini-2.5-flash-think'  // 深度刻画 - 高质量
  };

  return modelMap[modelChoice] || 'gemini-2.5-flash';
}

/**
 * POST handler for fanfic generation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('=== Received request data ===', JSON.stringify(body, null, 2));

    const { source, pairing, plotType, prompt, model, locale, outputLanguage, options, turnstileToken } = body;

    // Validate required fields
    if (!source || !source.name) {
      console.log('Validation failed: source is empty');
      return respErr('Source work is required');
    }

    if (!pairing || !pairing.characters || pairing.characters.length === 0) {
      console.log('Validation failed: pairing is empty');
      return respErr('At least one character is required for pairing');
    }

    if (!plotType) {
      console.log('Validation failed: plotType is empty');
      return respErr('Plot type is required');
    }

    if (!prompt || !prompt.trim()) {
      console.log('Validation failed: prompt is empty');
      return respErr('Story prompt is required');
    }

    if (!model) {
      console.log('Validation failed: model is empty');
      return respErr('Please select an AI model');
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      console.log('No turnstile token provided');
      return respErr('verification required');
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      console.log('Turnstile token validation failed');
      return respErr('verification failed');
    }

    console.log('✓ Turnstile verification passed, proceeding with fanfic generation');

    // Get API key
    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      return respErr('API KEY not found');
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt(locale || 'en');
    const userPrompt = buildUserPrompt(body, locale || 'en');

    // Select model
    const selectedModel = selectModel(model || 'standard');
    console.log('=== Model mapping ===', { requestedModel: model, actualModel: selectedModel });

    const requestBody = {
      model: selectedModel,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    };
    console.log('=== Request to GRSAI API ===', JSON.stringify(requestBody, null, 2));

    // Call GRSAI API with streaming
    const response = await fetch('https://api.grsai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('=== GRSAI API Response Status ===', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error:', response.status, errorText);
      return respErr(`API Error: ${response.status} - ${errorText}`);
    }

    console.log('Fanfic generation started...' + response);

    if (!response.body) {
      return respErr('No response body from API');
    }

    // Use TransformStream for better Cloudflare Workers compatibility
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let insideThinkTag = false; // Track if we're inside <think> tags
    let chunkCount = 0;
    let buffer = ''; // Buffer for incomplete lines

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        chunkCount++;
        const text = decoder.decode(chunk, { stream: true });
        console.log(`=== Chunk ${chunkCount} ===`, text.substring(0, 100));

        // Add to buffer
        buffer += text;

        // Split by newlines but keep the last incomplete line in buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep last incomplete line

        for (const line of lines) {
          // OpenAI SSE format: "data: {...}"
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove "data: " prefix

            if (data === '[DONE]') {
              console.log('=== Received [DONE] signal ===');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              let content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                console.log('=== Raw content ===', content.substring(0, 50));

                // Check for <think> tag opening
                if (content.includes('<think>')) {
                  insideThinkTag = true;
                  console.log('=== Detected <think> tag, filtering thinking process ===');
                  const thinkIndex = content.indexOf('<think>');
                  if (thinkIndex > 0) {
                    content = content.substring(0, thinkIndex);
                  } else {
                    content = '';
                  }
                }

                // Check for </think> tag closing
                if (content.includes('</think>')) {
                  insideThinkTag = false;
                  console.log('=== Detected </think> tag, resuming fanfic content ===');
                  const thinkCloseIndex = content.indexOf('</think>');
                  content = content.substring(thinkCloseIndex + 8);
                }

                // Skip content if we're inside thinking tags
                if (insideThinkTag) {
                  console.log('=== Skipping thinking content ===');
                  continue;
                }

                // Send all non-thinking content directly
                if (content.trim()) {
                  console.log('=== Extracted content ===', content.substring(0, 50));
                  const escaped = content
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t');

                  const formattedChunk = `0:"${escaped}"\n`;
                  console.log('=== Formatted chunk ===', formattedChunk.substring(0, 100));
                  controller.enqueue(encoder.encode(formattedChunk));
                }
              } else {
                console.log('=== No content in delta ===', JSON.stringify(parsed.choices?.[0]));
              }
            } catch (e) {
              console.log('Parse error:', e, 'Line:', data.substring(0, 100));
            }
          }
        }
      },

      flush(controller) {
        console.log('=== Stream finished, total chunks: ' + chunkCount + ' ===');
        // Process any remaining buffer
        if (buffer.trim()) {
          console.log('=== Processing remaining buffer ===', buffer.substring(0, 100));
        }
      }
    });

    // Pipe the response body through our transform stream
    const transformedStream = response.body.pipeThrough(transformStream);

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error: any) {
    console.log('Fanfic generation failed:', error);
    return respErr('bad request: ' + error);
  }
}
