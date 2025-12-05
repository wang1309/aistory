import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";
import { FantasyGenerateRequest } from "@/types/blocks/fantasy-generate";

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  console.log("=== Turnstile Verification Debug (Fantasy Gen) ===");
  console.log("Token received:", token ? `Present (${token.length} chars)` : "Missing");
  console.log("Secret key configured:", secretKey ? "Yes" : "No");

  if (!secretKey) {
    console.log("TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  try {
    const cached = await isIdentityVerifiedInKv();
    if (cached) {
      console.log("Using Turnstile KV cache (Fantasy Gen)");
      return true;
    }
  } catch (e) {
    console.log("Turnstile KV cache check failed (Fantasy Gen)", e);
  }

  try {
    const requestBody = {
      secret: secretKey,
      response: token,
    };

    console.log("Sending verification request to Cloudflare...");

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();
    console.log("Cloudflare response:", JSON.stringify(data, null, 2));

    if (data.success) {
      console.log("✓ Verification successful");
    } else {
      console.log("✗ Verification failed");
      console.log("Error codes:", data["error-codes"]);
    }

    const success = data.success === true;

    if (success) {
      try {
        await markIdentityVerifiedInKv();
      } catch (e) {
        console.log("Turnstile KV cache write failed (Fantasy Gen)", e);
      }
    }

    return success;
  } catch (error) {
    console.log("Turnstile verification error:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const requestData: FantasyGenerateRequest = await req.json();
    console.log("=== Fantasy Generate Request ===", JSON.stringify(requestData, null, 2));

    const {
      mode,
      prompt,
      subgenre,
      tone,
      audience,
      length,
      perspective,
      setting,
      magicSystem,
      protagonist,
      antagonist,
      plot,
      model,
      locale,
      outputLanguage,
      turnstileToken,
    } = requestData;

    // Validation
    if (mode === "quick" && !prompt) {
      console.log("Validation failed: prompt is empty in quick mode");
      return respErr("Please enter your story idea");
    }

    if (!subgenre) {
      console.log("Validation failed: subgenre is empty");
      return respErr("Please select a fantasy subgenre");
    }

    if (!model) {
      console.log("Validation failed: model is empty");
      return respErr("Please select an AI model");
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      console.log("No turnstile token provided");
      return respErr("Verification required");
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      console.log("Turnstile token validation failed");
      return respErr("Verification failed");
    }

    console.log("✓ Turnstile verification passed, proceeding with fantasy story generation");

    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      return respErr("API KEY not found");
    }

    // Generate the prompt based on mode
    const finalPrompt = mode === "quick"
      ? generateQuickModePrompt(requestData)
      : generateWorldbuilderPrompt(requestData);

    console.log("=== Generated prompt ===", finalPrompt.substring(0, 500) + "...");

    // Map model keys to actual model names
    const modelMap: Record<string, string> = {
      "fast": "gemini-2.5-flash-lite",
      "standard": "gemini-2.5-flash",
      "creative": "gemini-2.5-flash-think",
    };

    const actualModel = modelMap[model] || "gemini-2.5-flash";
    console.log("=== Model mapping ===", { requestedModel: model, actualModel });

    const requestBody = {
      model: actualModel,
      stream: true,
      messages: [
        {
          role: "system",
          content: getSystemPrompt(locale || "en"),
        },
        { role: "user", content: finalPrompt },
      ],
    };

    console.log("=== Request to GRSAI API ===", JSON.stringify(requestBody, null, 2));

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
      console.log("API Error:", response.status, errorText);
      return respErr(`API Error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      return respErr("No response body from API");
    }

    // Use TransformStream for streaming
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let insideThinkTag = false;
    let chunkCount = 0;
    let buffer = "";

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        chunkCount++;
        const text = decoder.decode(chunk, { stream: true });

        buffer += text;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              console.log("=== Received [DONE] signal ===");
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              let content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                // Filter <think> tags
                if (content.includes("<think>")) {
                  insideThinkTag = true;
                  const thinkIndex = content.indexOf("<think>");
                  if (thinkIndex > 0) {
                    content = content.substring(0, thinkIndex);
                  } else {
                    content = "";
                  }
                }

                if (content.includes("</think>")) {
                  insideThinkTag = false;
                  const thinkCloseIndex = content.indexOf("</think>");
                  content = content.substring(thinkCloseIndex + 8);
                }

                if (insideThinkTag) {
                  continue;
                }

                if (content.trim()) {
                  const escaped = content
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t');

                  const formattedChunk = `0:"${escaped}"\n`;
                  controller.enqueue(encoder.encode(formattedChunk));
                }
              }
            } catch (e) {
              console.log("Parse error:", e, "Line:", data.substring(0, 100));
            }
          }
        }
      },

      flush(controller) {
        console.log("=== Stream finished, total chunks: " + chunkCount + " ===");
      }
    });

    const transformedStream = response.body.pipeThrough(transformStream);

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.log("Fantasy story generation failed:", e);
    return respErr("Bad request: " + e);
  }
}

function getSystemPrompt(locale: string): string {
  const isZh = locale === "zh";
  return isZh
    ? `你是一位资深的奇幻小说作家，曾获得多项文学奖项。你擅长创作各种类型的奇幻故事，包括高魔奇幻、都市奇幻、东方玄幻、仙侠修真、黑暗奇幻等。你的作品以丰富的世界观、鲜明的角色塑造和引人入胜的情节著称。请根据用户的要求创作奇幻故事。`
    : `You are a renowned fantasy novelist who has won multiple literary awards. You excel at creating various types of fantasy stories, including high fantasy, urban fantasy, eastern fantasy, xianxia/cultivation, dark fantasy, and more. Your works are known for rich worldbuilding, vivid character development, and captivating plots. Please create fantasy stories based on user requirements.`;
}

function generateQuickModePrompt(request: FantasyGenerateRequest): string {
  const { prompt, subgenre, tone, audience, length, perspective, locale } = request;
  const isZh = locale === "zh";

  // Subgenre mapping
  const subgenreMap: Record<string, { zh: string; en: string }> = {
    "high_fantasy": { zh: "高魔奇幻", en: "High Fantasy" },
    "urban_fantasy": { zh: "都市奇幻", en: "Urban Fantasy" },
    "eastern_fantasy": { zh: "东方玄幻", en: "Eastern Fantasy" },
    "xianxia": { zh: "仙侠修真", en: "Xianxia/Cultivation" },
    "dark_fantasy": { zh: "黑暗奇幻", en: "Dark Fantasy" },
    "comedic_fantasy": { zh: "搞笑奇幻", en: "Comedic Fantasy" },
    "steampunk": { zh: "蒸汽朋克", en: "Steampunk Fantasy" },
    "epic_fantasy": { zh: "史诗奇幻", en: "Epic Fantasy" },
  };

  const toneMap: Record<string, { zh: string; en: string }> = {
    "lighthearted": { zh: "轻松愉快", en: "Lighthearted" },
    "healing": { zh: "治愈温馨", en: "Healing/Cozy" },
    "epic": { zh: "史诗恢弘", en: "Epic/Grand" },
    "dark": { zh: "黑暗沉重", en: "Dark/Gritty" },
    "tragic": { zh: "悲剧虐心", en: "Tragic" },
    "passionate": { zh: "热血激昂", en: "Passionate/Hot-blooded" },
  };

  const audienceMap: Record<string, { zh: string; en: string }> = {
    "children": { zh: "儿童", en: "Children" },
    "teens": { zh: "青少年", en: "Teens/Young Adults" },
    "adults": { zh: "成人", en: "Adults" },
  };

  const lengthMap: Record<string, { zh: string; en: string; words: string }> = {
    "opening": { zh: "开头片段", en: "Opening Fragment", words: "~500" },
    "short": { zh: "短篇故事", en: "Short Story", words: "~1500" },
    "medium_outline": { zh: "中篇+大纲", en: "Medium with Outline", words: "~2500" },
  };

  const perspectiveMap: Record<string, { zh: string; en: string }> = {
    "first_person": { zh: "第一人称", en: "First Person" },
    "third_person_limited": { zh: "第三人称有限", en: "Third Person Limited" },
    "omniscient": { zh: "全知视角", en: "Omniscient" },
  };

  const selectedSubgenre = subgenreMap[subgenre] || subgenreMap["high_fantasy"];
  const selectedTone = tone && tone !== "none" ? toneMap[tone] : null;
  const selectedAudience = audience && audience !== "none" ? audienceMap[audience] : null;
  const selectedLength = lengthMap[length || "short"];
  const selectedPerspective = perspective && perspective !== "none" ? perspectiveMap[perspective] : null;

  let promptText = isZh
    ? `请创作一个${selectedSubgenre.zh}类型的奇幻故事。\n\n`
    : `Please write a ${selectedSubgenre.en} fantasy story.\n\n`;

  promptText += isZh
    ? `## 故事核心想法\n${prompt}\n\n`
    : `## Story Core Idea\n${prompt}\n\n`;

  promptText += isZh ? `## 创作要求\n` : `## Requirements\n`;

  promptText += isZh
    ? `- **子类型**: ${selectedSubgenre.zh}\n`
    : `- **Subgenre**: ${selectedSubgenre.en}\n`;

  if (selectedTone) {
    promptText += isZh
      ? `- **故事基调**: ${selectedTone.zh}\n`
      : `- **Tone**: ${selectedTone.en}\n`;
  }

  if (selectedAudience) {
    promptText += isZh
      ? `- **目标受众**: ${selectedAudience.zh}\n`
      : `- **Target Audience**: ${selectedAudience.en}\n`;
  }

  promptText += isZh
    ? `- **篇幅**: ${selectedLength.zh}（约${selectedLength.words}字）\n`
    : `- **Length**: ${selectedLength.en} (${selectedLength.words} words)\n`;

  if (selectedPerspective) {
    promptText += isZh
      ? `- **叙事视角**: ${selectedPerspective.zh}\n`
      : `- **Perspective**: ${selectedPerspective.en}\n`;
  }

  promptText += isZh
    ? `\n## 写作指导\n1. 创造一个引人入胜的开场，立即吸引读者\n2. 构建独特的奇幻世界观元素\n3. 塑造有深度的角色\n4. 情节紧凑，有起承转合\n5. 语言风格符合${selectedSubgenre.zh}的特点\n\n`
    : `\n## Writing Guidelines\n1. Create an engaging opening that immediately hooks the reader\n2. Build unique fantasy world elements\n3. Develop characters with depth\n4. Keep the plot tight with proper story structure\n5. Match the language style to ${selectedSubgenre.en} conventions\n\n`;

  promptText += isZh
    ? `⚠️ 请用中文创作整个故事。`
    : `⚠️ Please write the entire story in English.`;

  return promptText;
}

function generateWorldbuilderPrompt(request: FantasyGenerateRequest): string {
  const { subgenre, setting, magicSystem, protagonist, antagonist, plot, locale } = request;
  const isZh = locale === "zh";

  const subgenreMap: Record<string, { zh: string; en: string }> = {
    "high_fantasy": { zh: "高魔奇幻", en: "High Fantasy" },
    "urban_fantasy": { zh: "都市奇幻", en: "Urban Fantasy" },
    "eastern_fantasy": { zh: "东方玄幻", en: "Eastern Fantasy" },
    "xianxia": { zh: "仙侠修真", en: "Xianxia/Cultivation" },
    "dark_fantasy": { zh: "黑暗奇幻", en: "Dark Fantasy" },
    "comedic_fantasy": { zh: "搞笑奇幻", en: "Comedic Fantasy" },
    "steampunk": { zh: "蒸汽朋克", en: "Steampunk Fantasy" },
    "epic_fantasy": { zh: "史诗奇幻", en: "Epic Fantasy" },
  };

  const eraMap: Record<string, { zh: string; en: string }> = {
    "medieval": { zh: "中世纪", en: "Medieval" },
    "modern": { zh: "现代", en: "Modern Day" },
    "future": { zh: "未来/科幻", en: "Future/Sci-Fantasy" },
    "ancient": { zh: "远古", en: "Ancient" },
    "mixed": { zh: "架空混合", en: "Mixed/Alternate" },
  };

  const magicSourceMap: Record<string, { zh: string; en: string }> = {
    "innate": { zh: "天赋", en: "Innate Talent" },
    "bloodline": { zh: "血统", en: "Bloodline/Heritage" },
    "cultivation": { zh: "修炼", en: "Cultivation/Training" },
    "contract": { zh: "契约", en: "Contracts/Pacts" },
    "technology": { zh: "科技魔法", en: "Magitech/Technology" },
    "divine": { zh: "神赐", en: "Divine/Granted by Gods" },
  };

  const selectedSubgenre = subgenreMap[subgenre] || subgenreMap["high_fantasy"];
  const selectedEra = setting?.era ? eraMap[setting.era] : null;
  const selectedMagicSource = magicSystem?.source ? magicSourceMap[magicSystem.source] : null;

  let promptText = isZh
    ? `请根据以下详细的世界观设定，创作一个${selectedSubgenre.zh}类型的奇幻故事。\n\n`
    : `Please write a ${selectedSubgenre.en} fantasy story based on the following detailed worldbuilding.\n\n`;

  // World Setting
  promptText += isZh ? `## 世界设定\n` : `## World Setting\n`;
  
  if (selectedEra) {
    promptText += isZh
      ? `- **时代背景**: ${selectedEra.zh}\n`
      : `- **Era**: ${selectedEra.en}\n`;
  }

  if (setting?.worldOverview) {
    promptText += isZh
      ? `- **世界概况**: ${setting.worldOverview}\n`
      : `- **World Overview**: ${setting.worldOverview}\n`;
  }

  if (setting?.factions) {
    promptText += isZh
      ? `- **主要势力**: ${setting.factions}\n`
      : `- **Major Factions**: ${setting.factions}\n`;
  }

  // Magic System
  promptText += isZh ? `\n## 魔法系统\n` : `\n## Magic System\n`;

  if (selectedMagicSource) {
    promptText += isZh
      ? `- **魔法来源**: ${selectedMagicSource.zh}\n`
      : `- **Magic Source**: ${selectedMagicSource.en}\n`;
  }

  if (magicSystem?.cost) {
    promptText += isZh
      ? `- **魔法代价**: ${magicSystem.cost}\n`
      : `- **Cost of Magic**: ${magicSystem.cost}\n`;
  }

  if (magicSystem?.limitations) {
    promptText += isZh
      ? `- **限制与规则**: ${magicSystem.limitations}\n`
      : `- **Limitations**: ${magicSystem.limitations}\n`;
  }

  // Characters
  promptText += isZh ? `\n## 角色设定\n` : `\n## Characters\n`;

  if (protagonist) {
    promptText += isZh ? `### 主角\n` : `### Protagonist\n`;
    if (protagonist.name) {
      promptText += isZh
        ? `- **姓名/代称**: ${protagonist.name}\n`
        : `- **Name**: ${protagonist.name}\n`;
    }
    if (protagonist.raceClass) {
      promptText += isZh
        ? `- **种族/职业**: ${protagonist.raceClass}\n`
        : `- **Race/Class**: ${protagonist.raceClass}\n`;
    }
    if (protagonist.personality) {
      promptText += isZh
        ? `- **性格**: ${protagonist.personality}\n`
        : `- **Personality**: ${protagonist.personality}\n`;
    }
    if (protagonist.background) {
      promptText += isZh
        ? `- **背景与缺点**: ${protagonist.background}\n`
        : `- **Background & Flaw**: ${protagonist.background}\n`;
    }
    if (protagonist.goal) {
      promptText += isZh
        ? `- **目标与动力**: ${protagonist.goal}\n`
        : `- **Goal & Motivation**: ${protagonist.goal}\n`;
    }
  }

  if (antagonist) {
    promptText += isZh ? `\n### 反派\n` : `\n### Antagonist\n`;
    if (antagonist.name) {
      promptText += isZh
        ? `- **姓名/代称**: ${antagonist.name}\n`
        : `- **Name**: ${antagonist.name}\n`;
    }
    if (antagonist.motivation) {
      promptText += isZh
        ? `- **目标与动机**: ${antagonist.motivation}\n`
        : `- **Goal & Motivation**: ${antagonist.motivation}\n`;
    }
    if (antagonist.relationship) {
      promptText += isZh
        ? `- **与主角的关系**: ${antagonist.relationship}\n`
        : `- **Relationship to Protagonist**: ${antagonist.relationship}\n`;
    }
  }

  // Plot
  promptText += isZh ? `\n## 剧情设定\n` : `\n## Plot\n`;

  if (plot?.mainQuest) {
    promptText += isZh
      ? `- **主线任务**: ${plot.mainQuest}\n`
      : `- **Main Quest**: ${plot.mainQuest}\n`;
  }

  if (plot?.keyEvents) {
    promptText += isZh
      ? `- **关键节点**: ${plot.keyEvents}\n`
      : `- **Key Events**: ${plot.keyEvents}\n`;
  }

  if (plot?.twists) {
    promptText += isZh
      ? `- **预设反转**: ${plot.twists}\n`
      : `- **Plot Twists**: ${plot.twists}\n`;
  }

  // Writing guidelines
  promptText += isZh
    ? `\n## 写作要求\n1. 根据上述设定创作一个完整的奇幻故事开篇（约2000-3000字）\n2. 充分展现世界观的独特之处\n3. 让魔法系统自然融入故事\n4. 深入刻画主角的性格和动机\n5. 为后续剧情发展埋下伏笔\n6. 语言风格符合${selectedSubgenre.zh}的特点\n\n⚠️ 请用中文创作整个故事。`
    : `\n## Writing Requirements\n1. Create a complete fantasy story opening based on the above settings (~2000-3000 words)\n2. Fully showcase the unique aspects of the world\n3. Naturally integrate the magic system into the story\n4. Deeply portray the protagonist's personality and motivation\n5. Plant seeds for future plot development\n6. Match the language style to ${selectedSubgenre.en} conventions\n\n⚠️ Please write the entire story in English.`;

  return promptText;
}
