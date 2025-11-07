import { respErr } from "@/lib/resp";
import { buildPlotPrompt } from "@/lib/plot-prompt";
import type { PlotGenerateOptions } from "@/types/plot";

export const runtime = "edge";

/**
 * 验证 Cloudflare Turnstile Token
 */
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  console.log("=== Turnstile Verification Debug (Plot Gen) ===");
  console.log("Token received:", token ? `Present (${token.length} chars)` : "Missing");
  console.log("Secret key configured:", secretKey ? "Yes" : "No");

  if (!secretKey) {
    console.log("TURNSTILE_SECRET_KEY is not configured");
    return false;
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

    return data.success === true;
  } catch (error) {
    console.log("Turnstile verification error:", error);
    return false;
  }
}

/**
 * Plot Generator API
 * 生成故事大纲（Plot）
 */
export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    console.log("=== Plot Generator Request ===", JSON.stringify(requestData, null, 2));

    const {
      prompt,
      model,
      locale,
      complexity,
      mainCharacterCount,
      supportingCharacterCount,
      plotPointCount,
      subPlotCount,
      conflictTypes,
      emotionalArc,
      suspenseStyle,
      genre,
      tone,
      perspective,
      turnstileToken
    } = requestData || {};

    // 参数验证
    if (!prompt || prompt.trim().length === 0) {
      console.log("Validation failed: prompt is empty");
      return respErr("Please provide a story concept or idea");
    }

    if (!model) {
      console.log("Validation failed: model is empty");
      return respErr("Please select an AI model");
    }

    if (!complexity) {
      console.log("Validation failed: complexity is empty");
      return respErr("Please select complexity level");
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

    console.log("✓ Turnstile verification passed, proceeding with plot generation");

    // API Key 检查
    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      console.log("GRSAI_API_KEY not found");
      return respErr("API KEY not configured");
    }

    // 构建 Plot 生成选项
    const plotOptions: PlotGenerateOptions = {
      prompt: prompt.trim(),
      model,
      locale: locale || 'en',
      complexity,
      mainCharacterCount: mainCharacterCount || 1,
      supportingCharacterCount: supportingCharacterCount || 0,
      plotPointCount: plotPointCount || (complexity === 'simple' ? 3 : complexity === 'medium' ? 5 : 9),
      subPlotCount: subPlotCount || 0,
      conflictTypes: Array.isArray(conflictTypes) ? conflictTypes : ['both'],
      emotionalArc: emotionalArc || 'growth',
      suspenseStyle: suspenseStyle || 'none',
      genre,
      tone,
      perspective
    };

    // 构建 AI Prompt
    const finalPrompt = buildPlotPrompt(plotOptions);
    console.log("=== Generated Plot Prompt ===");
    console.log(finalPrompt.substring(0, 300) + "...");

    // 模型映射（与 Story Generator 保持一致）
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
          content: "You are an expert story architect and plot designer. You help writers create detailed, well-structured story outlines with compelling characters and engaging plot structures."
        },
        {
          role: "user",
          content: finalPrompt
        },
      ],
    };

    console.log("=== Calling GRSAI API ===");

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
                  // 过滤 <think> 标签内容（AI 思考过程）
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
        console.log("Stream flush complete");
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
    console.log("Plot generation error:", error);
    return respErr(`Plot generation failed: ${error}`);
  }
}
