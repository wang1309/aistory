import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { buildPoemPrompt } from "@/lib/poem-prompt-builder";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";
import type { PoemGenerateOptions } from "@/types/poem";

/**
 * 验证 Cloudflare Turnstile Token
 */
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  console.log("=== Turnstile Verification Debug (Poem Gen) ===");
  console.log("Token received:", token ? `Present (${token.length} chars)` : "Missing");
  console.log("Secret key configured:", secretKey ? "Yes" : "No");

  if (!secretKey) {
    console.log("TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  try {
    const cached = await isIdentityVerifiedInKv();
    if (cached) {
      console.log("Using Turnstile KV cache (Poem Gen)");
      return true;
    }
  } catch (e) {
    console.log("Turnstile KV cache check failed (Poem Gen)", e);
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
        console.log("Turnstile KV cache write failed (Poem Gen)", e);
      }
    }

    return success;
  } catch (error) {
    console.log("Turnstile verification error:", error);
    return false;
  }
}

/**
 * Poem Generator API
 * 生成诗歌
 */
export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    console.log("=== Poem Generator Request ===", JSON.stringify(requestData, null, 2));

    const {
      prompt,
      model,
      locale,
      poemType,
      length,
      rhymeScheme,
      theme,
      mood,
      style,
      classicalOptions,
      turnstileToken
    } = requestData || {};

    // 参数验证
    if (!prompt || prompt.trim().length === 0) {
      console.log("Validation failed: prompt is empty");
      return respErr("Please provide a poem theme or inspiration");
    }

    if (!model) {
      console.log("Validation failed: model is empty");
      return respErr("Please select an AI model");
    }

    if (!poemType) {
      console.log("Validation failed: poemType is empty");
      return respErr("Please select a poem type");
    }

    if (!length) {
      console.log("Validation failed: length is empty");
      return respErr("Please select poem length");
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

    console.log("✓ Turnstile verification passed, proceeding with poem generation");

    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      return respErr("API KEY not found");
    }

    // 构建 Poem 生成参数
    const poemOptions: PoemGenerateOptions = {
      prompt,
      model,
      locale: locale || 'en',
      poemType,
      length,
      rhymeScheme,
      theme,
      mood,
      style,
      classicalOptions,
      turnstileToken
    };

    // 使用 poem-prompt-builder 构建提示词
    const finalPrompt = buildPoemPrompt(poemOptions);
    console.log("=== Generated Poem Prompt ===", finalPrompt.substring(0, 300) + "...");

    // 模型映射（复用 Story Generator 的模型）
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
          content: "You are a talented and creative poet skilled in various poetic forms and styles across different languages and cultures."
        },
        { role: "user", content: finalPrompt },
      ],
    };
    console.log("=== Request to GRSAI API ===", JSON.stringify(requestBody, null, 2));

    // 调用 GRSAI API（流式响应）
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

    console.log("Poem generation started..." + response);

    if (!response.body) {
      return respErr("No response body from API");
    }

    // 使用 TransformStream 处理流式响应
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let insideThinkTag = false; // 跟踪是否在 <think> 标签内
    let chunkCount = 0;
    let buffer = ""; // 缓冲区用于处理不完整的行

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        chunkCount++;
        const text = decoder.decode(chunk, { stream: true });
        console.log(`=== Chunk ${chunkCount} ===`, text.substring(0, 100));

        // 添加到缓冲区
        buffer += text;

        // 按换行符分割，但保留最后一个不完整的行在缓冲区中
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // 保留最后一个不完整的行

        for (const line of lines) {
          // OpenAI SSE 格式: "data: {...}"
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // 移除 "data: " 前缀

            if (data === "[DONE]") {
              console.log("=== Received [DONE] signal ===");
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              let content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                console.log("=== Raw content ===", content.substring(0, 50));

                // 检查 <think> 标签开始
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

                // 检查 </think> 标签结束
                if (content.includes("</think>")) {
                  insideThinkTag = false;
                  console.log("=== Detected </think> tag, resuming poem content ===");
                  const thinkCloseIndex = content.indexOf("</think>");
                  content = content.substring(thinkCloseIndex + 8);
                }

                // 如果在思考标签内，跳过内容
                if (insideThinkTag) {
                  console.log("=== Skipping thinking content ===");
                  continue;
                }

                // 发送非思考内容
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
              console.log("Parse error:", e, "Line:", data.substring(0, 100));
            }
          }
        }
      },

      flush(controller) {
        console.log("=== Stream finished, total chunks: " + chunkCount + " ===");
        // 处理剩余的缓冲区
        if (buffer.trim()) {
          console.log("=== Processing remaining buffer ===", buffer.substring(0, 100));
        }
      }
    });

    // 通过 transform stream 传输响应体
    const transformedStream = response.body.pipeThrough(transformStream);

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.log("Poem generation failed:", e);
    return respErr("bad request: " + e);
  }
}
