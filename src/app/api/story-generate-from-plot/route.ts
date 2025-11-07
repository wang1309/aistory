import { respErr } from "@/lib/resp";
import type { PlotData } from "@/types/plot";

export const runtime = "edge";

/**
 * 验证 Cloudflare Turnstile Token
 */
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  console.log("=== Turnstile Verification Debug (Plot→Story) ===");
  console.log("Token received:", token ? `Present (${token.length} chars)` : "Missing");

  if (!secretKey) {
    console.log("TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const data = await response.json();
    console.log("Turnstile verification result:", data.success);

    return data.success === true;
  } catch (error) {
    console.log("Turnstile verification error:", error);
    return false;
  }
}

/**
 * Plot to Story Generator API
 * 基于 Plot 大纲生成完整故事
 */
export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    console.log("=== Plot→Story Request ===", JSON.stringify(requestData, null, 2));

    const {
      plotData,
      plotId,
      overrides,
      turnstileToken
    } = requestData || {};

    // 参数验证
    if (!plotData && !plotId) {
      console.log("Validation failed: no plot data or plotId provided");
      return respErr("Plot data is required");
    }

    const plot: PlotData = plotData;

    if (!plot || !plot.content) {
      console.log("Validation failed: plot content is empty");
      return respErr("Plot content is required");
    }

    // Turnstile 验证
    if (!turnstileToken) {
      console.log("No turnstile token provided");
      return respErr("Verification required");
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      console.log("Turnstile token validation failed");
      return respErr("Verification failed");
    }

    console.log("✓ Turnstile verification passed");

    // API Key 检查
    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      console.log("GRSAI_API_KEY not found");
      return respErr("API KEY not configured");
    }

    // 构建 Story 生成参数（从 Plot 继承 + 用户覆盖）
    const storyPrompt = `Based on the following story plot outline, write a complete and engaging story.

${plot.content}

---

Please expand this outline into a full narrative story. Maintain the structure, characters, and plot points described in the outline, but add dialogue, descriptions, and emotional depth to bring the story to life.`;

    // 合并参数：Plot 默认值 + 用户覆盖
    const model = overrides?.model || plot.model || 'standard';
    const locale = overrides?.locale || plot.locale || 'en';
    const format = overrides?.format || 'prose';
    const length = overrides?.length || 'medium';
    const genre = overrides?.genre || plot.genre || null;
    const tone = overrides?.tone || plot.tone || null;
    const perspective = overrides?.perspective || plot.perspective || 'third-person-limited';
    const audience = overrides?.audience || 'adults';

    console.log("=== Story Generation Parameters ===", {
      model,
      locale,
      format,
      length,
      genre,
      tone,
      perspective,
      audience
    });

    // 参数映射（与 story-generate 保持一致）
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
      "short": "Short (300-600 words)",
      "medium": "Medium (600-900 words)",
      "long": "Long (900-1200 words)",
      "extend": "Extended (1200-1500 words)",
      "epic-short": "Epic Short (1500-2000 words)",
      "novella-lite": "Novella-Lite (2000-3000 words)",
    };

    const mapPerspective: Record<string, string> = {
      "first-person": "First Person",
      "second-person": "Second Person",
      "third-person-limited": "Third Person Limited",
      "third-person-omniscient": "Third Person Omniscient",
    };

    // 语言名称映射
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
    const isZh = locale === 'zh' || locale === 'zh-CN';

    // 构建最终 prompt
    let finalPrompt = storyPrompt;

    // 添加格式要求
    if (format && mapFormat[format]) {
      finalPrompt += isZh
        ? `\n\n格式要求：${mapFormat[format]}`
        : `\n\nFormat requirement: ${mapFormat[format]}`;
    }

    // 添加长度要求
    if (length && mapLength[length]) {
      finalPrompt += isZh
        ? `\n长度要求：${mapLength[length]}`
        : `\nLength requirement: ${mapLength[length]}`;
    }

    // 添加视角要求
    if (perspective && mapPerspective[perspective]) {
      finalPrompt += isZh
        ? `\n叙事视角：${mapPerspective[perspective]}`
        : `\nNarrative perspective: ${mapPerspective[perspective]}`;
    }

    // 添加类型和基调
    if (genre) {
      finalPrompt += isZh
        ? `\n故事类型：${genre}`
        : `\nGenre: ${genre}`;
    }

    if (tone) {
      finalPrompt += isZh
        ? `\n基调风格：${tone}`
        : `\nTone: ${tone}`;
    }

    // 添加语言指示
    finalPrompt += isZh
      ? `\n\n**重要：请用${currentLanguage.native}写作整个故事。**`
      : `\n\n**IMPORTANT: Write the entire story in ${currentLanguage.english}.**`;

    console.log("=== Final Story Prompt ===");
    console.log(finalPrompt.substring(0, 500) + "...");

    // 模型映射
    const modelMap: Record<string, string> = {
      "fast": "gemini-2.5-flash-lite",
      "standard": "gemini-2.5-flash",
      "creative": "gemini-2.5-flash-think",
    };

    const actualModel = modelMap[model] || "gemini-2.5-flash";
    console.log("=== Model mapping ===", { requestedModel: model, actualModel });

    // 构建 GRSAI API 请求
    const requestBody = {
      model: actualModel,
      stream: true,
      messages: [
        {
          role: "system",
          content: isZh
            ? "你是一个资深专业的故事创作助手，也是一名诺贝尔文学奖获得者。你擅长将故事大纲扩展为生动、引人入胜的完整故事。"
            : "You are an expert storyteller and a Nobel Prize-winning author. You excel at expanding story outlines into vivid, engaging complete narratives."
        },
        {
          role: "user",
          content: finalPrompt
        },
      ],
    };

    console.log("=== Calling GRSAI API for story generation ===");

    // 调用 GRSAI API
    const response = await fetch("https://api.grsai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("GRSAI API error:", response.status, errorText);
      return respErr(`API request failed: ${response.status}`);
    }

    if (!response.body) {
      console.log("Response body is null");
      return respErr("No response body from AI service");
    }

    console.log("✓ GRSAI API response received, starting streaming");

    // 处理流式响应
    let insideThinkTag = false;
    const encoder = new TextEncoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                console.log("Stream completed: [DONE] received");
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";

                if (content) {
                  // 过滤 <think> 标签内容
                  if (content.includes("<think>")) {
                    insideThinkTag = true;
                  }

                  if (insideThinkTag) {
                    if (content.includes("</think>")) {
                      insideThinkTag = false;
                    }
                    continue;
                  }

                  // 转义特殊字符用于 SSE
                  const escaped = content
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t');

                  // 发送数据块
                  controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
                }
              } catch (parseError) {
                console.log("Failed to parse SSE data:", parseError);
              }
            }
          }
        } catch (error) {
          console.log("Transform error:", error);
        }
      },
      flush(controller) {
        console.log("Story generation stream flush complete");
      }
    });

    const readableStream = response.body.pipeThrough(transformStream);

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.log("Plot→Story generation error:", error);
    return respErr(`Story generation from plot failed: ${error}`);
  }
}
