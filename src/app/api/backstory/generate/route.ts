import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";

/**
 * Verify Cloudflare Turnstile Token
 */
async function verifyTurnstileToken(token: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    console.log("=== Turnstile Verification Debug (Backstory Gen) ===");
    console.log("Token received:", token ? `Present (${token.length} chars)` : "Missing");
    console.log("Secret key configured:", secretKey ? "Yes" : "No");

    if (!secretKey) {
        console.log("TURNSTILE_SECRET_KEY is not configured");
        return false;
    }

    try {
        const cached = await isIdentityVerifiedInKv();
        if (cached) {
            console.log("Using Turnstile KV cache (Backstory Gen)");
            return true;
        }
    } catch (e) {
        console.log("Turnstile KV cache check failed (Backstory Gen)", e);
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
                console.log("Turnstile KV cache write failed (Backstory Gen)", e);
            }
        }

        return success;
    } catch (error) {
        console.log("Turnstile verification error:", error);
        return false;
    }
}

/**
 * Build the prompt for backstory generation
 */
function buildBackstoryPrompt(options: {
    prompt: string;
    locale: string;
    worldview: string;
    roleType: string;
    tone: string;
    length: string;
}): string {
    const { prompt, locale, worldview, roleType, tone, length } = options;
    const isZh = locale === 'zh';

    // Language name mapping (aligned with Story Generator language options)
    const languageNames: Record<string, { native: string; english: string }> = {
        'en': { native: 'English', english: 'English' },
        'zh': { native: '\u4e2d\u6587', english: 'Chinese' },
        'ja': { native: '\u65e5\u672c\u8a9e', english: 'Japanese' },
        'ko': { native: '\ud55c\uad6d\uc5b4', english: 'Korean' },
        'es': { native: 'Espa\u00f1ol', english: 'Spanish' },
        'fr': { native: 'Fran\u00e7ais', english: 'French' },
        'de': { native: 'Deutsch', english: 'German' },
        'pt': { native: 'Portugu\u00eas', english: 'Portuguese' },
        'ru': { native: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', english: 'Russian' },
        'ar': { native: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', english: 'Arabic' },
        'hi': { native: '\u0939\u093f\u0928\u094d\u0926\u0940', english: 'Hindi' },
        'it': { native: 'Italiano', english: 'Italian' },
    };

    const currentLanguage = languageNames[locale] || languageNames['en'];

    // Worldview mapping
    const worldviewMap: Record<string, { zh: string; en: string }> = {
        'fantasy': { zh: '奇幻世界', en: 'Fantasy world' },
        'scifi': { zh: '科幻世界', en: 'Science Fiction world' },
        'urban': { zh: '都市现代', en: 'Modern Urban setting' },
        'xianxia': { zh: '仙侠修真', en: 'Xianxia/Cultivation world' },
        'historical': { zh: '历史架空', en: 'Historical/Alternative History' },
        'campus': { zh: '校园青春', en: 'Campus/School setting' },
        'dnd': { zh: 'DND/TRPG', en: 'DND/TRPG setting' },
        'cyberpunk': { zh: '赛博朋克', en: 'Cyberpunk world' },
    };

    // Role type mapping
    const roleTypeMap: Record<string, { zh: string; en: string }> = {
        'protagonist': { zh: '主角', en: 'Protagonist' },
        'supporting': { zh: '配角', en: 'Supporting Character' },
        'antagonist': { zh: '反派', en: 'Antagonist' },
        'npc': { zh: 'NPC/路人', en: 'NPC' },
        'vtuber': { zh: '虚拟人/VTuber', en: 'Virtual Character/VTuber' },
    };

    // Tone mapping
    const toneMap: Record<string, { zh: string; en: string }> = {
        'dark': { zh: '黑暗', en: 'Dark' },
        'inspirational': { zh: '励志', en: 'Inspirational' },
        'comedic': { zh: '喜剧', en: 'Comedic' },
        'tragic': { zh: '悲剧', en: 'Tragic' },
        'epic': { zh: '史诗', en: 'Epic' },
    };

    // Length mapping
    const lengthMap: Record<string, { zh: string; en: string; words: string }> = {
        'short': { zh: '简短版', en: 'Short', words: '200-400' },
        'medium': { zh: '标准版', en: 'Medium', words: '400-800' },
        'detailed': { zh: '详细版', en: 'Detailed', words: '800-1500' },
    };

    const selectedWorldview = worldviewMap[worldview] || worldviewMap['fantasy'];
    const selectedRole = roleTypeMap[roleType] || roleTypeMap['protagonist'];
    const selectedTone = toneMap[tone] || toneMap['inspirational'];
    const selectedLength = lengthMap[length] || lengthMap['medium'];

    let promptText = isZh
        ? `请为以下角色概念生成一个完整的人物背景故事：\n\n「${prompt}」\n\n`
        : `Generate a complete character backstory for the following concept:\n\n"${prompt}"\n\n`;

    // Add worldview context
    promptText += isZh
        ? `## 世界观设定\n这个角色存在于一个${selectedWorldview.zh}的世界中。\n\n`
        : `## World Setting\nThis character exists in a ${selectedWorldview.en}.\n\n`;

    // Add role type context
    promptText += isZh
        ? `## 角色类型\n这是一个${selectedRole.zh}角色。\n\n`
        : `## Character Role\nThis is a ${selectedRole.en} character.\n\n`;

    // Add tone context
    promptText += isZh
        ? `## 故事基调\n背景故事应该采用${selectedTone.zh}的基调。\n\n`
        : `## Story Tone\nThe backstory should have a ${selectedTone.en} tone.\n\n`;

    // Add length context
    promptText += isZh
        ? `## 输出长度\n${selectedLength.zh}（${selectedLength.words}字）\n\n`
        : `## Output Length\n${selectedLength.en} (${selectedLength.words} words)\n\n`;

    // Structure requirements
    promptText += isZh
        ? `## 结构要求\n请按照以下结构生成背景故事：\n\n### 基本信息\n- 简要概述角色的核心身份\n\n### 成长经历\n- **童年**：早年生活与关键影响\n- **转折点**：改变人生轨迹的关键事件\n- **现状**：当前的处境与状态\n\n### 人际关系\n- 重要的人物关系（家人、导师、挚友、宿敌等）\n\n### 内在特质\n- **性格特征**：主要性格标签\n- **缺陷与弱点**：内在的矛盾与困扰\n- **信念与价值观**：驱动行为的核心信念\n\n### 目标与冲突\n- **短期目标**：当前正在追求的\n- **长期目标**：人生的终极追求\n- **未解之谜**：角色不知道或不敢面对的真相\n\n### 剧情钩子\n- 可用于故事发展的悬念点或冲突线索\n\n`
        : `## Structure Requirements\nPlease generate the backstory with the following structure:\n\n### Basic Info\n- Brief overview of the character's core identity\n\n### Life Journey\n- **Childhood**: Early life and key influences\n- **Turning Point**: Events that changed their path\n- **Present**: Current situation and status\n\n### Relationships\n- Important relationships (family, mentors, friends, rivals, etc.)\n\n### Inner Traits\n- **Personality**: Key personality traits\n- **Flaws & Weaknesses**: Internal conflicts and troubles\n- **Beliefs & Values**: Core beliefs driving behavior\n\n### Goals & Conflicts\n- **Short-term Goal**: What they're currently pursuing\n- **Long-term Goal**: Ultimate life pursuit\n- **Unresolved Mystery**: Truths the character doesn't know or won't face\n\n### Story Hooks\n- Suspense points or conflict threads for story development\n\n`;

    // Final language instruction
    promptText += isZh
        ? `\n\n⚠️ 重要：请使用${currentLanguage.native}输出所有内容。确保背景故事逻辑自洽，人物动机清晰，事件之间有因果关系。`
        : `\n\n⚠️ IMPORTANT: Write the entire output in ${currentLanguage.english}. Ensure the backstory is logically consistent, character motivations are clear, and events have causal relationships.`;

    return promptText;
}

/**
 * Backstory Generator API
 * Generates character backstories
 */
export async function POST(req: Request) {
    try {
        const requestData = await req.json();
        console.log("=== Backstory Generator Request ===", JSON.stringify(requestData, null, 2));

        const {
            prompt,
            model,
            locale,
            worldview,
            roleType,
            tone,
            length,
            turnstileToken
        } = requestData || {};

        // Parameter validation
        if (!prompt || prompt.trim().length === 0) {
            console.log("Validation failed: prompt is empty");
            return respErr("Please provide a character concept");
        }

        if (!model) {
            console.log("Validation failed: model is empty");
            return respErr("Please select an AI model");
        }

        // Turnstile verification
        if (!turnstileToken) {
            console.log("No turnstile token provided");
            return respErr("Verification required");
        }

        const isValidToken = await verifyTurnstileToken(turnstileToken);
        if (!isValidToken) {
            console.log("Turnstile token validation failed");
            return respErr("Verification failed");
        }

        console.log("✓ Turnstile verification passed, proceeding with backstory generation");

        // API Key check
        const apiKey = process.env.GRSAI_API_KEY;
        if (!apiKey) {
            console.log("GRSAI_API_KEY not found");
            return respErr("API KEY not configured");
        }

        // Build AI Prompt
        const finalPrompt = buildBackstoryPrompt({
            prompt: prompt.trim(),
            locale: locale || 'en',
            worldview: worldview || 'fantasy',
            roleType: roleType || 'protagonist',
            tone: tone || 'inspirational',
            length: length || 'medium'
        });
        console.log("=== Generated Backstory Prompt ===");
        console.log(finalPrompt.substring(0, 300) + "...");

        // Model mapping
        const modelMap: Record<string, string> = {
            "fast": "gemini-2.5-flash-lite",
            "standard": "gemini-2.5-flash",
            "creative": "gemini-2.5-flash-think",
        };

        const actualModel = modelMap[model] || "gemini-2.5-flash";
        console.log("=== Model mapping ===", { requestedModel: model, actualModel });

        // Build GRSAI API request
        const requestBody = {
            model: actualModel,
            stream: true,
            messages: [
                {
                    role: "system",
                    content: "You are an expert character designer and backstory writer. You help creators build rich, detailed character backgrounds for RPGs, novels, virtual characters, and chatbots. Your backstories are logically consistent, emotionally resonant, and provide clear hooks for storytelling."
                },
                {
                    role: "user",
                    content: finalPrompt
                },
            ],
        };

        console.log("=== Calling GRSAI API ===");

        // Call GRSAI API
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

        // Handle streaming response
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
                                    // Filter <think> tag content (AI thinking process)
                                    if (content.includes("<think>")) {
                                        insideThinkTag = true;
                                    }

                                    if (insideThinkTag) {
                                        if (content.includes("</think>")) {
                                            insideThinkTag = false;
                                        }
                                        continue;
                                    }

                                    // Escape special characters for SSE
                                    const escaped = content
                                        .replace(/\\/g, '\\\\')
                                        .replace(/"/g, '\\"')
                                        .replace(/\n/g, '\\n')
                                        .replace(/\r/g, '\\r')
                                        .replace(/\t/g, '\\t');

                                    // Send data chunk
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
        console.log("Backstory generation error:", error);
        return respErr(`Backstory generation failed: ${error}`);
    }
}
