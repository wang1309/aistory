import "@/lib/logger";
import { respErr, respData } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";

interface PromptGenerateRequest {
  genres: string[];
  length: string;
  tone: string;
  locale: string;
  model: string;
  // Advanced options
  worldview?: string;
  protagonist?: string;
  goal?: string;
  conflict?: string;
  constraints?: string;
  audience?: string;
  count?: number; // Number of prompts to generate (default 5)
  turnstileToken: string;
}

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.log("TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  try {
    const cached = await isIdentityVerifiedInKv();
    if (cached) {
      console.log("Using Turnstile KV cache (Story Prompt)");
      return true;
    }
  } catch (e) {
    console.log("Turnstile KV cache check failed", e);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const data = await response.json();
    const success = data.success === true;

    if (success) {
      try {
        await markIdentityVerifiedInKv();
      } catch (e) {
        console.log("Turnstile KV cache write failed", e);
      }
    }

    return success;
  } catch (error) {
    console.log("Turnstile verification error:", error);
    return false;
  }
}

// Genre mapping
const genreMap: Record<string, { en: string; zh: string }> = {
  fantasy: { en: "Fantasy", zh: "奇幻" },
  scifi: { en: "Science Fiction", zh: "科幻" },
  romance: { en: "Romance", zh: "言情" },
  thriller: { en: "Thriller", zh: "惊悚" },
  mystery: { en: "Mystery", zh: "悬疑" },
  horror: { en: "Horror", zh: "恐怖" },
  adventure: { en: "Adventure", zh: "冒险" },
  historical: { en: "Historical Fiction", zh: "历史" },
  urban: { en: "Urban/Contemporary", zh: "都市" },
  comedy: { en: "Comedy", zh: "喜剧" },
  drama: { en: "Drama", zh: "剧情" },
  xianxia: { en: "Xianxia/Cultivation", zh: "仙侠/修真" },
};

// Length mapping
const lengthMap: Record<string, { en: string; zh: string; words: string }> = {
  short: { en: "Short story", zh: "短篇", words: "300-800" },
  medium: { en: "Medium-length story", zh: "中篇", words: "800-2000" },
  long: { en: "Long story/Novel", zh: "长篇", words: "2000+" },
};

// Tone mapping
const toneMap: Record<string, { en: string; zh: string }> = {
  light: { en: "Light and fun", zh: "轻松欢快" },
  healing: { en: "Healing and warm", zh: "治愈温暖" },
  dark: { en: "Dark and gritty", zh: "黑暗沉重" },
  passionate: { en: "Passionate and intense", zh: "热血激昂" },
  realistic: { en: "Realistic and grounded", zh: "现实向" },
  suspenseful: { en: "Suspenseful", zh: "悬疑紧张" },
  romantic: { en: "Romantic", zh: "浪漫唯美" },
  epic: { en: "Epic and grand", zh: "史诗宏大" },
};

// Worldview mapping
const worldviewMap: Record<string, { en: string; zh: string }> = {
  realistic: { en: "Realistic/Modern world", zh: "现实/现代世界" },
  near_future: { en: "Near future", zh: "近未来" },
  high_fantasy: { en: "High fantasy world", zh: "高魔奇幻世界" },
  cultivation: { en: "Cultivation/Xianxia world", zh: "修真/仙侠世界" },
  cyberpunk: { en: "Cyberpunk world", zh: "赛博朋克世界" },
  post_apocalyptic: { en: "Post-apocalyptic world", zh: "末日废土世界" },
  steampunk: { en: "Steampunk world", zh: "蒸汽朋克世界" },
  mythology: { en: "Mythological world", zh: "神话世界" },
};

// Conflict mapping
const conflictMap: Record<string, { en: string; zh: string }> = {
  person_vs_person: { en: "Person vs Person", zh: "人与人的冲突" },
  person_vs_society: { en: "Person vs Society", zh: "人与社会的冲突" },
  person_vs_nature: { en: "Person vs Nature", zh: "人与自然的冲突" },
  person_vs_self: { en: "Person vs Self (internal conflict)", zh: "人与自我的冲突" },
  person_vs_fate: { en: "Person vs Fate/Destiny", zh: "人与命运的冲突" },
  multi_conflict: { en: "Multiple intertwined conflicts", zh: "多线交织冲突" },
};

// Audience mapping
const audienceMap: Record<string, { en: string; zh: string }> = {
  children: { en: "Children (5-12)", zh: "儿童 (5-12岁)" },
  teen: { en: "Teenagers (13-17)", zh: "青少年 (13-17岁)" },
  young_adult: { en: "Young Adults (18-25)", zh: "青年 (18-25岁)" },
  adult: { en: "Adults (26+)", zh: "成人 (26岁+)" },
  mature: { en: "Mature readers", zh: "成熟读者" },
  all_ages: { en: "All ages", zh: "全年龄" },
};

function buildPromptGenerationRequest(data: PromptGenerateRequest): string {
  const isZh = data.locale === "zh";
  const count = data.count || 5;

  // Build genre string
  const genreStrings = data.genres.map(g => {
    const genre = genreMap[g];
    return genre ? (isZh ? genre.zh : genre.en) : g;
  });
  const genreStr = genreStrings.join(isZh ? "、" : ", ");

  // Get length info
  const lengthInfo = lengthMap[data.length] || lengthMap.medium;
  const lengthStr = isZh ? lengthInfo.zh : lengthInfo.en;

  // Get tone info
  const toneInfo = toneMap[data.tone] || toneMap.light;
  const toneStr = isZh ? toneInfo.zh : toneInfo.en;

  let prompt = "";

  if (isZh) {
    prompt = `你是一个专业的故事创意顾问，擅长为作家提供高质量的故事灵感和写作提示。

请根据以下要求，生成 ${count} 条独特且富有创意的故事提示（Story Prompts）：

## 基本要求
- **故事类型**：${genreStr}
- **篇幅**：${lengthStr}（约 ${lengthInfo.words} 字）
- **基调风格**：${toneStr}`;

    // Add advanced options if provided
    if (data.worldview && worldviewMap[data.worldview]) {
      prompt += `\n- **世界观设定**：${worldviewMap[data.worldview].zh}`;
    }
    if (data.protagonist) {
      prompt += `\n- **主角特征**：${data.protagonist}`;
    }
    if (data.goal) {
      prompt += `\n- **故事目标**：${data.goal}`;
    }
    if (data.conflict && conflictMap[data.conflict]) {
      prompt += `\n- **核心冲突**：${conflictMap[data.conflict].zh}`;
    }
    if (data.constraints) {
      prompt += `\n- **特殊限制**：${data.constraints}`;
    }
    if (data.audience && audienceMap[data.audience]) {
      prompt += `\n- **目标读者**：${audienceMap[data.audience].zh}`;
    }

    prompt += `

## 输出格式要求（务必严格按 JSON 数组返回，不要使用 Markdown、不要添加说明文字）
返回形如：
[
  {
    "title": "提示的标题",
    "prompt": "完整的故事提示正文，可直接粘贴到写作工具",
    "hook": "1-2 句能抓住读者的开篇钩子"
  },
  ...
]

要求：
1) 必须是合法 JSON，数组长度为 ${count}。
2) 每个对象字段必填：title、prompt、hook；可以根据需要附加其他有用字段，但不要出现 null。
3) prompt 字段应包含核心设定、主角、目标、冲突、开篇钩子等要素，可直接使用。
4) 严禁输出 JSON 外的多余文本、注释、Markdown、分隔线。`;

  } else {
    prompt = `You are a professional story consultant who excels at providing high-quality story ideas and writing prompts for writers.

Please generate ${count} unique and creative story prompts based on the following requirements:

## Basic Requirements
- **Genre(s)**: ${genreStr}
- **Length**: ${lengthStr} (approximately ${lengthInfo.words} words)
- **Tone/Mood**: ${toneStr}`;

    // Add advanced options if provided
    if (data.worldview && worldviewMap[data.worldview]) {
      prompt += `\n- **World Setting**: ${worldviewMap[data.worldview].en}`;
    }
    if (data.protagonist) {
      prompt += `\n- **Protagonist Traits**: ${data.protagonist}`;
    }
    if (data.goal) {
      prompt += `\n- **Story Goal**: ${data.goal}`;
    }
    if (data.conflict && conflictMap[data.conflict]) {
      prompt += `\n- **Core Conflict**: ${conflictMap[data.conflict].en}`;
    }
    if (data.constraints) {
      prompt += `\n- **Special Constraints**: ${data.constraints}`;
    }
    if (data.audience && audienceMap[data.audience]) {
      prompt += `\n- **Target Audience**: ${audienceMap[data.audience].en}`;
    }

    prompt += `

## Output Format (STRICT JSON array, no Markdown, no extra text)
Return exactly:
[
  {
    "title": "A concise title",
    "prompt": "A complete, ready-to-use story prompt with setting, protagonist, goal, conflict, and an opening hook",
    "hook": "1-2 sentences that grab the reader at the start"
  },
  ...
]

Rules:
1) Must be valid JSON, array length ${count}.
2) Required fields per object: title, prompt, hook. Do not emit null; omit unknown fields.
3) prompt should already include setting, protagonist, goal, conflict, and an opening hook so writers can paste directly.
4) Do NOT add any explanations, comments, Markdown, code fences, or text outside the JSON.`;
  }

  return prompt;
}

export async function POST(req: Request) {
  try {
    const requestData: PromptGenerateRequest = await req.json();
    console.log("=== Story Prompt Generate Request ===", JSON.stringify(requestData, null, 2));

    const { genres, length, tone, locale, model, turnstileToken } = requestData;

    // Validation
    if (!genres || genres.length === 0) {
      return respErr("Please select at least one genre");
    }

    if (!turnstileToken) {
      return respErr("Verification required");
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return respErr("Verification failed");
    }

    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      return respErr("API KEY not found");
    }

    // Build the prompt
    const finalPrompt = buildPromptGenerationRequest(requestData);
    console.log("=== Generated System Prompt ===", finalPrompt.substring(0, 500) + "...");

    // Map model keys
    const modelMap: Record<string, string> = {
      fast: "gemini-2.5-flash-lite",
      standard: "gemini-2.5-flash",
      creative: "gemini-2.5-flash-think",
    };

    const actualModel = modelMap[model] || "gemini-2.5-flash";

    const requestBody = {
      model: actualModel,
      stream: true,
      messages: [
        {
          role: "system",
          content: "你是一个专业的故事创意顾问，擅长生成独特、有创意且可执行的故事提示。",
        },
        { role: "user", content: finalPrompt },
      ],
    };

    // Call API with streaming
    const response = await fetch("https://api.grsai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("API Error:", response.status, errorText);
      return respErr(`API Error: ${response.status}`);
    }

    if (!response.body) {
      return respErr("No response body from API");
    }

    // Stream processing
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let insideThinkTag = false;
    let buffer = "";

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        buffer += text;

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              let content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                // Filter <think> tags
                if (content.includes("<think>")) {
                  insideThinkTag = true;
                  const idx = content.indexOf("<think>");
                  content = idx > 0 ? content.substring(0, idx) : "";
                }

                if (content.includes("</think>")) {
                  insideThinkTag = false;
                  const idx = content.indexOf("</think>");
                  content = content.substring(idx + 8);
                }

                if (insideThinkTag) continue;

                if (content.trim()) {
                  const escaped = content
                    .replace(/\\/g, "\\\\")
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/\t/g, "\\t");

                  controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
                }
              }
            } catch (e) {
              console.log("Parse error:", e);
            }
          }
        }
      },
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
    console.log("Story prompt generation failed:", e);
    return respErr("Bad request: " + e);
  }
}
