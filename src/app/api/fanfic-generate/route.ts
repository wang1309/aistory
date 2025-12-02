import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";

// Language display names for prompts
const languageNames: Record<string, { native: string; english: string }> = {
  zh: { native: '中文', english: 'Chinese' },
  en: { native: 'English', english: 'English' },
  es: { native: 'Español', english: 'Spanish' },
  hi: { native: 'हिन्दी', english: 'Hindi' },
  ar: { native: 'العربية', english: 'Arabic' },
  pt: { native: 'Português', english: 'Portuguese' },
  ru: { native: 'Русский', english: 'Russian' },
  ja: { native: '日本語', english: 'Japanese' },
  de: { native: 'Deutsch', english: 'German' },
  fr: { native: 'Français', english: 'French' },
  ko: { native: '한국어', english: 'Korean' },
  it: { native: 'Italiano', english: 'Italian' },
};

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  console.log("=== Turnstile Verification Debug (Fanfic Gen) ===");
  console.log("Token received:", token ? `Present (${token.length} chars)` : "Missing");
  console.log("Secret key configured:", secretKey ? "Yes" : "No");

  if (!secretKey) {
    console.log("TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  try {
    const cached = await isIdentityVerifiedInKv();
    if (cached) {
      console.log("Using Turnstile KV cache (Fanfic Gen)");
      return true;
    }
  } catch (e) {
    console.log("Turnstile KV cache check failed (Fanfic Gen)", e);
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
        console.log("Turnstile KV cache write failed (Fanfic Gen)", e);
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
    const requestData = await req.json();
    console.log("=== Fanfic Generation Request ===", JSON.stringify(requestData, null, 2));
    console.log("=== Raw request data keys ===", Object.keys(requestData || {}));
    console.log("=== Source type ===", requestData?.sourceType);
    console.log("=== Prompt ===", requestData?.prompt?.substring(0, 100));
    console.log("=== Characters ===", requestData?.characters);
    console.log("=== Pairing type ===", requestData?.pairingType);

    const {
      sourceType,
      presetWorkId,
      customWorkName,
      pairingType,
      characters,
      plotType,
      prompt,
      language = 'zh',
      options = {},
      turnstileToken,
      model: requestedModel = 'creative',
    } = requestData || {};

    console.log("=== Extracted params ===", {
      sourceType,
      presetWorkId,
      customWorkName,
      pairingType,
      characters,
      plotType,
      prompt: prompt?.substring(0, 100),
      language,
      options,
      turnstileToken: turnstileToken ? "Present" : "Missing",
      model: requestedModel,
    });

    // Validate required fields
    if (!prompt || prompt.trim().length === 0) {
      console.log("Validation failed: prompt is empty");
      return respErr("prompt is required");
    }

    if (!pairingType) {
      console.log("Validation failed: pairing type not specified");
      return respErr("pairing type is required");
    }

    if (!characters || characters.length === 0) {
      console.log("Validation failed: characters not specified");
      return respErr("at least one character is required");
    }

    if (!plotType) {
      console.log("Validation failed: plot type not specified");
      return respErr("plot type is required");
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      console.log("No turnstile token provided");
      return respErr("verification required");
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      console.log("Turnstile token validation failed");
      return respErr("verification failed");
    }

    console.log("✓ Turnstile verification passed, proceeding with fanfic generation");

    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      return respErr("API KEY not found");
    }

    // Map fanfic-specific parameters to story generation parameters
    const format = "prose"; // Fanfic is always prose format
    const perspective = "third-person-limited"; // Default perspective for fanfic
    const audience = "young-adults"; // Default audience
    const tone = "dramatic"; // Default tone for fanfic

    // Map story length
    const lengthMap: Record<string, string> = {
      "short": "short",
      "medium": "medium",
      "long": "long",
      "extend": "extend",
      "epic_short": "epic-short",
      "novella_lite": "novella-lite",
    };

    // Map OOC level to genre
    const oocMap: Record<string, string> = {
      "none": "fantasy", // Default to fantasy if no restriction
      "slight": "fantasy",
      "moderate": "drama",
      "bold": "adventure",
    };

    const model = typeof requestedModel === "string" && requestedModel
      ? requestedModel
      : "creative"; // Default logical model key
    const mappedLength = lengthMap[options.length || "medium"] || "medium";
    const mappedGenre = oocMap[options.ooc || "none"] || "fantasy";

    // Generate a comprehensive fanfic prompt
    const isZh = language === 'zh';

    const sourceInfo = sourceType === 'preset'
      ? "Based on the preset work"
      : `Based on custom work: ${customWorkName}`;

    const characterInfo = `Characters: ${characters.join(', ')}`;
    const pairingInfo = `Pairing type: ${pairingType}`;
    const plotInfo = `Plot type: ${plotType}`;
    const oocInfo = `OOC level: ${options.ooc || 'none'}`;
    const fidelityInfo = `Source fidelity: ${options.fidelity || 'none'}`;

    const fanficPrompt = isZh
      ? `请根据以下信息创作一篇同人小说：

${sourceInfo}
${characterInfo}
${pairingInfo}
${plotInfo}
${oocInfo}
${fidelityInfo}

故事背景和设定：
用户提供的具体情节或场景：${prompt}

创作要求：
1. 以散文形式创作，注重情节发展和人物塑造
2. 故事长度：${mappedLength}
3. 叙事视角：第三人称有限视角
4. 目标受众：年轻成人
5. 语气：戏剧性
6. 语言：${languageNames[language]?.native || languageNames['zh'].native}

请确保：
- 遵循原作的世界观设定（如果适用）
- 角色性格符合原作特征
- 情节紧凑，富有吸引力
- 注重人物情感和关系发展
- 适合年轻成人阅读`
      : `Please create a fanfiction story based on the following information:

${sourceInfo}
${characterInfo}
${pairingInfo}
${plotInfo}
${oocInfo}
${fidelityInfo}

Story background and setting:
User-provided plot or scene: ${prompt}

Writing requirements:
1. Write in prose format, focusing on plot development and character development
2. Story length: ${mappedLength}
3. Narrative perspective: Third Person Limited
4. Target audience: Young Adults
5. Tone: Dramatic
6. Language: ${languageNames[language]?.english || languageNames['en'].english}

Please ensure:
- Follow the original work's worldview (if applicable)
- Character personalities match the original work
- Compelling and engaging plot
- Focus on character emotions and relationship development
- Suitable for young adult readers`;

    const finalPrompt = fanficPrompt;

    // Map obfuscated model keys to actual model names
    const modelMap: Record<string, string> = {
      "character_focused": "gemini-2.5-flash-lite",
      "creative": "gemini-2.5-flash",
      "depth": "gemini-2.5-flash-think",
    };

    const actualModel = modelMap[model] || "gemini-2.5-flash";
    console.log("=== Model mapping ===", { requestedModel: model, actualModel });

    const requestBody = {
      model: actualModel,
      stream: true,
      messages: [
        { role: "system", content: "You are a professional fanfiction writer with expertise in character-driven storytelling and relationship development" },
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

    console.log("Fanfic generation started...");

    if (!response.body) {
      return respErr("No response body from API");
    }

    // Use TransformStream for better Cloudflare Workers compatibility
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let insideThinkTag = false;
    let chunkCount = 0;
    let buffer = "";

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        chunkCount++;
        const text = decoder.decode(chunk, { stream: true });

        // Add to buffer
        buffer += text;

        // Split by newlines but keep the last incomplete line in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              let content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                // Check for <think> tag opening
                if (content.includes("<think>")) {
                  insideThinkTag = true;
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
                  const thinkCloseIndex = content.indexOf("</think>");
                  content = content.substring(thinkCloseIndex + 8);
                }

                // Skip content if we're inside thinking tags
                if (insideThinkTag) {
                  continue;
                }

                // Send all non-thinking content directly
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
        if (buffer.trim()) {
          console.log("=== Processing remaining buffer ===", buffer.substring(0, 100));
        }
      }
    });

    // Pipe the response body through our transform stream
    const transformedStream = response.body.pipeThrough(transformStream);

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.log("Fanfic generation failed:", e);
    return respErr("bad request: " + e);
  }
}
