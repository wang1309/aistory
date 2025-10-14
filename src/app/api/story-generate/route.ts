import { respErr } from "@/lib/resp";

export const runtime = "edge";

interface StoryOptions {
  format: string | null;
  storyLength: string | null;
  genre: string | null;
  narrativePerspective: string | null;
  targetAudience: string | null;
  toneMood: string | null;
}

interface UserInput {
  prompt: string;
  locale?: string;
  options: StoryOptions;
}

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    console.log("=== Received request data ===", JSON.stringify(requestData, null, 2));

    const { prompt, model, locale, format, length, genre, perspective, audience, tone } = requestData || {};
    console.log("=== Extracted params ===", { prompt, model, locale, format, length, genre, perspective, audience, tone });

    if (!prompt) {
      console.error("Validation failed: prompt is empty");
      return respErr("invalid params");
    }

    if (!model) {
      console.error("Validation failed: model is empty");
      return respErr("please select an AI model");
    }

    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      return respErr("API KEY not found");
    }

    const mapFormat: Record<string, string> = {
      "prose": "Prose",
      "screenplay": "Screenplay",
      "short-story": "Short Story",
      "letter": "Letter",
      "diary": "Diary",
      "fairy-tale": "Fairy Tale",
      "myth": "Myth",
      "fable": "Fable",
      "poem": "Poem",
    };
    const mapLength: Record<string, string> = {
      "short": "Short",
      "medium": "Medium",
      "long": "Long",
      "extend": "Extend",
      "epic-short": "Epic Short",
      "novella-lite": "Novella-Lite",
    };
    const mapGenre: Record<string, string> = {
      "fantasy": "Fantasy",
      "science-fiction": "Science Fiction",
      "romance": "Romance",
      "thriller": "Thriller",
      "drama": "Drama",
      "comedy": "Comedy",
      "action": "Action",
      "western": "Western",
      "crime": "Crime",
      "horror": "Horror",
      "adventure": "Adventure",
      "historical": "Historical",
    };
    const mapPerspective: Record<string, string> = {
      "first-person": "First Person",
      "second-person": "Second Person",
      "third-person-limited": "Third Person Limited",
      "third-person-omniscient": "Third Person Omniscient",
    };
    const mapAudience: Record<string, string> = {
      "kids": "Kids",
      "pre-teen": "Pre-teens",
      "teens": "Teens",
      "young-adults": "Young Adults",
      "adults": "Adults",
      "mature-audience": "Mature Audience",
      "general": "General",
    };
    const mapTone: Record<string, string> = {
      "hopeful": "Hopeful",
      "dark": "Dark",
      "romantic": "Romantic",
      "suspenseful": "Suspenseful",
      "inspirational": "Inspirational",
      "funny": "Funny",
      "dramatic": "Dramatic",
      "whimsical": "Whimsical",
      "tragic": "Tragic",
    };

    const options: StoryOptions = {
      format: format === "none" ? null : mapFormat[format] ?? format ?? null,
      storyLength: length === "none" ? null : mapLength[length] ?? length ?? null,
      genre: genre === "none" ? null : mapGenre[genre] ?? genre ?? null,
      narrativePerspective:
        perspective === "none"
          ? null
          : mapPerspective[perspective] ?? perspective ?? null,
      targetAudience:
        audience === "none" ? null : mapAudience[audience] ?? audience ?? null,
      toneMood: tone === "none" ? null : mapTone[tone] ?? tone ?? null,
    };

    const finalPrompt = generatePrompt({ prompt, locale, options });
    console.log("=== Generated prompt ===", finalPrompt.substring(0, 200) + "...");

    // Map model ID to actual model name
    const modelMap: Record<string, string> = {
      "gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
      "gemini-2.5-flash": "gemini-2.5-flash",
      "gemini-2.5-flash-think": "gemini-2.5-flash-think",
    };

    const actualModel = modelMap[model] || "gemini-2.5-flash";
    console.log("=== Model mapping ===", { requestedModel: model, actualModel });

    const requestBody = {
      model: actualModel,
      stream: true,
      messages: [
        { role: "system", content: "你是一个专业的故事创作助手。" },
        { role: "user", content: finalPrompt },
      ],
    };
    console.log("=== Request to GRSAI API ===", JSON.stringify(requestBody, null, 2).substring(0, 500) + "...");

    // Call GRSAI API with streaming
    const response = await fetch("https://api.grsai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("=== GRSAI API Response Status ===", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      return respErr(`API Error: ${response.status} - ${errorText}`);
    }

    console.log("Story generation started..."+response);

    // Create a TransformStream to convert SSE format to plain text chunks
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          console.error("No reader available from response");
          controller.close();
          return;
        }

        console.log("=== Starting to read stream ===");
        let chunkCount = 0;
        let insideThinkTag = false; // Track if we're inside <think> tags

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log(`=== Stream finished, total chunks: ${chunkCount} ===`);
              break;
            }

            chunkCount++;
            const chunk = decoder.decode(value, { stream: true });
            console.log(`=== Chunk ${chunkCount} ===`, chunk.substring(0, 100));

            const lines = chunk.split("\n").filter(line => line.trim() !== "");

            for (const line of lines) {
              // OpenAI SSE format: "data: {...}"
              if (line.startsWith("data: ")) {
                const data = line.slice(6); // Remove "data: " prefix

                if (data === "[DONE]") {
                  console.log("=== Received [DONE] signal ===");
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  let content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    console.log("=== Raw content ===", content.substring(0, 50));

                    // Check for <think> tag opening
                    if (content.includes("<think>")) {
                      insideThinkTag = true;
                      console.log("=== Detected <think> tag, filtering thinking process ===");
                      const thinkIndex = content.indexOf("<think>");
                      if (thinkIndex > 0) {
                        content = content.substring(0, thinkIndex);
                      } else {
                        content = "";
                      }
                    }

                    // Check for </think> tag closing
                    if (content.includes("</think>")) {
                      insideThinkTag = false;
                      console.log("=== Detected </think> tag, resuming story content ===");
                      const thinkCloseIndex = content.indexOf("</think>");
                      content = content.substring(thinkCloseIndex + 8);
                    }

                    // Skip content if we're inside thinking tags
                    if (insideThinkTag) {
                      console.log("=== Skipping thinking content ===");
                      continue;
                    }

                    // Send all non-thinking content directly
                    if (content.trim()) {
                      console.log("=== Extracted content ===", content.substring(0, 50));
                      const escaped = content
                        .replace(/\\/g, '\\\\')
                        .replace(/"/g, '\\"')
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r')
                        .replace(/\t/g, '\\t');

                      const formattedChunk = `0:"${escaped}"\n`;
                      console.log("=== Formatted chunk ===", formattedChunk.substring(0, 100));
                      controller.enqueue(encoder.encode(formattedChunk));
                    }
                  } else {
                    console.log("=== No content in delta ===", JSON.stringify(parsed.choices?.[0]));
                  }
                } catch (e) {
                  console.error("Parse error:", e, "Line:", data.substring(0, 100));
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          console.log("=== Closing stream ===");
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e) {
    console.error("Story generation failed:", e);
    return respErr("bad request: " + e);
  }
}

function generatePrompt(userInput: UserInput): string {
  const { prompt, locale = 'en', options } = userInput;
  const { format, storyLength, genre, narrativePerspective, targetAudience, toneMood } = options;

  // Language configuration
  const isZh = locale === 'zh';

  // Language name mapping for final instruction
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

  const currentLanguage = languageNames[locale] || languageNames['en'];

  // Base prompt with language instruction
  let promptText = isZh
    ? `生成一个关于"${prompt}"的故事。\n\n重要：请用${currentLanguage.native}写作这个故事。\n\n`
    : `Write a story about "${prompt}".\n\nIMPORTANT: Write the story in ${currentLanguage.english}.\n\n`;

  if (format) {
    switch (format) {
      case "Prose":
        promptText += isZh
          ? `请以散文格式写作，注重描述和语言的优美。`
          : `Write in prose format, focusing on beautiful descriptions and language.`;
        break;
      case "Screenplay":
        promptText += isZh
          ? `请使用剧本格式，包含场景描述和角色对话。`
          : `Use screenplay format with scene descriptions and character dialogue.`;
        break;
      case "Short Story":
        promptText += isZh
          ? `请写一个短篇故事，语言简洁且情节集中。`
          : `Write a short story with concise language and focused plot.`;
        break;
      case "Letter":
        promptText += isZh
          ? `请以信件格式写作，注意表达清晰且有情感。`
          : `Write in letter format with clear and emotional expression.`;
        break;
      case "Diary":
        promptText += isZh
          ? `请以日记格式写作，注重个人情感的流露。`
          : `Write in diary format, emphasizing personal emotional expression.`;
        break;
      case "Fairy Tale":
        promptText += isZh
          ? `请写一个童话故事，具有神奇、幻想的元素。`
          : `Write a fairy tale with magical and fantastical elements.`;
        break;
      case "Myth":
        promptText += isZh
          ? `请写一个神话故事，充满传奇色彩。`
          : `Write a mythological story full of legendary elements.`;
        break;
      case "Fable":
        promptText += isZh
          ? `请写一个寓言故事，带有道德教育意义。`
          : `Write a fable with moral educational significance.`;
        break;
      case "Poem":
        promptText += isZh
          ? `请用诗歌格式写作，注重韵律与意境。`
          : `Write in poetic format, focusing on rhythm and artistic conception.`;
        break;
      default:
        promptText += isZh ? `请选择一个合适的格式。` : `Choose an appropriate format.`;
    }
  }

  if (storyLength) {
    switch (storyLength) {
      case "Short":
        promptText += isZh
          ? `故事长度为短篇（300-600字），情节应紧凑。`
          : `Short story length (300-600 words), plot should be compact.`;
        break;
      case "Medium":
        promptText += isZh
          ? `故事长度为中篇（600-900字），情节适中。`
          : `Medium story length (600-900 words), moderate plot.`;
        break;
      case "Long":
        promptText += isZh
          ? `故事长度为长篇（900-1200字），情节丰富。`
          : `Long story length (900-1200 words), rich plot.`;
        break;
      case "Extend":
        promptText += isZh
          ? `故事长度为扩展篇幅（1200-1500字），包含较多细节。`
          : `Extended length (1200-1500 words), with more details.`;
        break;
      case "Epic Short":
        promptText += isZh
          ? `故事长度为史诗短篇（1500-2000字），适合更复杂的情节。`
          : `Epic short length (1500-2000 words), suitable for complex plots.`;
        break;
      case "Novella-Lite":
        promptText += isZh
          ? `故事长度为短篇小说（2000-3000字），情节较为深入。`
          : `Novella-lite length (2000-3000 words), deeper plot development.`;
        break;
      default:
        promptText += isZh ? `请选择一个合适的故事长度。` : `Choose an appropriate story length.`;
    }
  }

  if (genre) {
    switch (genre) {
      case "Fantasy":
        promptText += isZh
          ? `故事体裁为奇幻，充满魔法和幻想元素。`
          : `Fantasy genre, full of magic and fantastical elements.`;
        break;
      case "Science Fiction":
        promptText += isZh
          ? `故事体裁为科幻，探索未来科技和外太空的可能性。`
          : `Science fiction genre, exploring future technology and outer space.`;
        break;
      case "Romance":
        promptText += isZh
          ? `故事体裁为爱情，强调人物间的情感与关系。`
          : `Romance genre, emphasizing emotions and relationships between characters.`;
        break;
      case "Thriller":
        promptText += isZh
          ? `故事体裁为惊悚，紧张刺激，充满悬疑。`
          : `Thriller genre, tense and suspenseful.`;
        break;
      case "Drama":
        promptText += isZh
          ? `故事体裁为戏剧，关注人物的情感和冲突。`
          : `Drama genre, focusing on character emotions and conflicts.`;
        break;
      case "Comedy":
        promptText += isZh
          ? `故事体裁为喜剧，情节轻松幽默，带有娱乐性。`
          : `Comedy genre, lighthearted and humorous with entertainment value.`;
        break;
      case "Action":
        promptText += isZh
          ? `故事体裁为动作，充满紧张的追逐和冲突。`
          : `Action genre, full of intense chases and conflicts.`;
        break;
      case "Western":
        promptText += isZh
          ? `故事体裁为西部，包含荒野与冒险的元素。`
          : `Western genre, containing wilderness and adventure elements.`;
        break;
      case "Crime":
        promptText += isZh
          ? `故事体裁为犯罪，涉及犯罪调查与破案过程。`
          : `Crime genre, involving criminal investigation and solving.`;
        break;
      case "Horror":
        promptText += isZh ? `故事体裁为恐怖。` : `Horror genre.`;
        break;
      case "Adventure":
        promptText += isZh ? `故事体裁为冒险。` : `Adventure genre.`;
        break;
      case "Historical":
        promptText += isZh ? `故事体裁为历史。` : `Historical genre.`;
        break;
      default:
        promptText += isZh ? `请选择一个合适的体裁。` : `Choose an appropriate genre.`;
    }
  }

  if (narrativePerspective) {
    switch (narrativePerspective) {
      case "First Person":
        promptText += isZh
          ? `故事从第一人称的视角进行叙述，重点关注人物的内心世界。`
          : `Narrate from first-person perspective, focusing on the character's inner world.`;
        break;
      case "Second Person":
        promptText += isZh
          ? `故事从第二人称的视角进行叙述，让读者感同身受。`
          : `Narrate from second-person perspective, making readers empathize.`;
        break;
      case "Third Person Limited":
        promptText += isZh
          ? `故事从第三人称有限视角进行叙述，聚焦一个特定人物的经历。`
          : `Narrate from third-person limited perspective, focusing on a specific character's experience.`;
        break;
      case "Third Person Omniscient":
        promptText += isZh
          ? `故事从全知视角进行叙述，展示多个人物的想法和情感。`
          : `Narrate from omniscient perspective, showing multiple characters' thoughts and emotions.`;
        break;
      default:
        promptText += isZh ? `请选择一个合适的叙述视角。` : `Choose an appropriate narrative perspective.`;
    }
  }

  if (targetAudience) {
    switch (targetAudience) {
      case "Kids":
        promptText += isZh
          ? `故事适合儿童（5-8岁），请使用简单易懂的语言。`
          : `Story suitable for kids (5-8 years old), use simple and understandable language.`;
        break;
      case "Pre-teens":
        promptText += isZh
          ? `故事适合青少年（9-12岁），内容适合这个年龄段的读者。`
          : `Story suitable for pre-teens (9-12 years old), content appropriate for this age group.`;
        break;
      case "Teens":
        promptText += isZh
          ? `故事适合青少年（13-17岁），情节富有张力和吸引力。`
          : `Story suitable for teens (13-17 years old), plot should be engaging and attractive.`;
        break;
      case "Young Adults":
        promptText += isZh
          ? `故事适合年轻成人（18-25岁），情节深入，探讨成长与自我发现。`
          : `Story suitable for young adults (18-25 years old), deep plot exploring growth and self-discovery.`;
        break;
      case "Adults":
        promptText += isZh
          ? `故事适合成年人（26-40岁），涉及更复杂的情感和社会议题。`
          : `Story suitable for adults (26-40 years old), involving complex emotions and social issues.`;
        break;
      case "Mature Audience":
        promptText += isZh
          ? `故事适合成熟观众（40+岁），关注深刻的人生议题。`
          : `Story suitable for mature audience (40+ years old), focusing on profound life issues.`;
        break;
      case "General":
        promptText += isZh ? `故事适合大众读者。` : `Story suitable for general readers.`;
        break;
      default:
        promptText += isZh ? `请选择一个合适的目标受众。` : `Choose an appropriate target audience.`;
    }
  }

  if (toneMood) {
    switch (toneMood) {
      case "Hopeful":
        promptText += isZh
          ? `故事的语气应当是充满希望的，具有积极向上的情感。`
          : `The tone should be hopeful with positive and uplifting emotions.`;
        break;
      case "Dark":
        promptText += isZh
          ? `故事的语气应当是黑暗的，充满阴郁和压抑的情感。`
          : `The tone should be dark with gloomy and oppressive emotions.`;
        break;
      case "Romantic":
        promptText += isZh
          ? `故事的语气应当是浪漫的，注重人物的情感发展。`
          : `The tone should be romantic, focusing on character emotional development.`;
        break;
      case "Suspenseful":
        promptText += isZh
          ? `故事的语气应当是悬疑的，充满紧张和不可预测的情节。`
          : `The tone should be suspenseful with tense and unpredictable plot.`;
        break;
      case "Inspirational":
        promptText += isZh ? `故事的语气应当是励志的。` : `The tone should be inspirational.`;
        break;
      case "Funny":
        promptText += isZh ? `故事的语气应当是幽默的。` : `The tone should be funny.`;
        break;
      case "Dramatic":
        promptText += isZh ? `故事的语气应当是戏剧性的。` : `The tone should be dramatic.`;
        break;
      case "Whimsical":
        promptText += isZh ? `故事的语气应当是异想天开的。` : `The tone should be whimsical.`;
        break;
      case "Tragic":
        promptText += isZh ? `故事的语气应当是悲剧的。` : `The tone should be tragic.`;
        break;
      default:
        promptText += isZh ? `请选择一个合适的语气/情绪。` : `Choose an appropriate tone/mood.`;
    }
  }

  // Writing guidelines
  promptText += isZh
    ? `\n\n### 写作指导：\n1. 结构清晰：确保故事具有明确的开端、发展和结尾，情节应紧凑有序。\n2. 情节推动：避免情节拖沓，确保每个场景和情节都推动故事的进展。\n3. 人物塑造：关注人物的内心世界与情感变化，突出人物的动机和个性特征。\n4. 语言风格：根据目标受众调整语言风格。对于儿童和青少年，应使用简单、直接且生动的语言；对于成人，可以使用更复杂和富有表现力的语言。\n5. 细节描写：在合适的地方加入细节描写，特别是对情感和环境的刻画，以增强故事的代入感。\n6. 节奏控制：根据语气调整节奏。例如，如果是悬疑或惊悚故事，应加快节奏，增加紧张感；如果是浪漫或感人的故事，可以适当放慢节奏，细腻地描写人物情感。\n\n### 注意事项：\n- 请避免情节上的突兀转折，确保故事的流畅性。\n- 在人物描写时，注重内心的变化和情感的递进，避免单一的情感表现。\n\n### 最终要求：\n⚠️ 输出结果请使用${currentLanguage.native}语言。整个故事必须用${currentLanguage.native}书写，不要使用其他语言。`
    : `\n\n### Writing Guidelines:\n1. Clear Structure: Ensure the story has a clear beginning, development, and ending with a compact and orderly plot.\n2. Plot Progression: Avoid dragging plot, ensure each scene and plot point drives the story forward.\n3. Character Development: Focus on characters' inner world and emotional changes, highlighting their motivations and personality traits.\n4. Language Style: Adjust language style based on target audience. For children and teens, use simple, direct, and vivid language; for adults, use more complex and expressive language.\n5. Detail Description: Add detailed descriptions where appropriate, especially for emotions and environment to enhance story immersion.\n6. Pacing Control: Adjust pacing based on tone. For suspense or thriller stories, quicken the pace to increase tension; for romantic or touching stories, slow down appropriately to delicately portray character emotions.\n\n### Important Notes:\n- Avoid abrupt plot twists, ensure story fluency.\n- When describing characters, focus on internal changes and emotional progression, avoid single emotional expression.\n\n### Final Requirement:\n⚠️ Please output the result in ${currentLanguage.english} language. The entire story must be written in ${currentLanguage.english}, do not use any other language.`;

  return promptText;
}