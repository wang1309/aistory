import "@/lib/logger";
import { respErr } from "@/lib/resp";
import { isIdentityVerifiedInKv, markIdentityVerifiedInKv } from "@/lib/turnstile-kv";
import type { PoemTitleGenerateOptions } from "@/types/poem-title";

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    console.log("=== Turnstile Verification Debug (Poem Title Gen) ===");
    console.log("Token received:", token ? `Present (${token.length} chars)` : "Missing");
    console.log("Secret key configured:", secretKey ? "Yes" : "No");

    if (!secretKey) {
        console.log("TURNSTILE_SECRET_KEY is not configured");
        return false;
    }

    try {
        const cached = await isIdentityVerifiedInKv();
        if (cached) {
            console.log("Using Turnstile KV cache (Poem Title Gen)");
            return true;
        }
    } catch (e) {
        console.log("Turnstile KV cache check failed (Poem Title Gen)", e);
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
                console.log("Turnstile KV cache write failed (Poem Title Gen)", e);
            }
        }

        return success;
    } catch (error) {
        console.log("Turnstile verification error:", error);
        return false;
    }
}

// Style display names mapping
const styleMap: Record<string, string> = {
    classical: "古风/Classical",
    modern: "现代/Modern",
    minimalist: "极简/Minimalist",
    imagist: "意象派/Imagist",
    dark: "黑暗系/Dark",
    healing: "治愈系/Healing",
    romantic: "浪漫/Romantic",
};

// Mood display names mapping
const moodMap: Record<string, string> = {
    sad: "悲伤/Sad",
    melancholic: "忧郁/Melancholic",
    calm: "平静/Calm",
    gentle: "温柔/Gentle",
    hopeful: "希望/Hopeful",
    angry: "愤怒/Angry",
    surreal: "超现实/Surreal",
};

// Length descriptions
const lengthMap: Record<string, string> = {
    short: "4-8 characters (concise and powerful)",
    medium: "8-12 characters (balanced and expressive)",
    long: "12+ characters (detailed and descriptive)",
};

// Usage scene descriptions
const usageSceneMap: Record<string, string> = {
    literary_submission: "Literary submission/journal publication",
    collection: "Poetry collection/personal anthology",
    social_media: "Social media sharing (WeChat, Weibo, Instagram)",
    competition: "Poetry competition entry",
    gift_card: "Gift card/personalized message",
};

// Language names
const languageNames: Record<string, { native: string; english: string }> = {
    zh: { native: "中文", english: "Chinese" },
    en: { native: "English", english: "English" },
    bilingual: { native: "中英双语", english: "Chinese-English Bilingual" },
};

// Build the AI prompt for poem title generation
function buildPrompt(options: PoemTitleGenerateOptions): string {
    const language = languageNames[options.language] || languageNames.zh;
    const styles = options.styles.map(s => styleMap[s] || s).join(", ") || "any style";
    const moods = options.moods.map(m => moodMap[m] || m).join(", ") || "any mood";
    const length = lengthMap[options.length] || lengthMap.medium;
    const scene = usageSceneMap[options.usageScene] || options.usageScene;

    const systemPrompt = `You are a talented poetry title expert who deeply understands both Eastern and Western poetry aesthetics. Your task is to generate creative, evocative, and market-ready poem titles.

CRITICAL REQUIREMENTS:
1. Generate exactly 6 titles total: 3 "Literary" titles and 3 "Platform" titles
2. Literary titles: Artistic, profound, suitable for journals and anthologies
3. Platform titles: Catchy, engaging, optimized for social media and viral potential
4. Each title MUST include a brief explanation connecting it to the poem's imagery/emotions
5. Output language: ${language.english} (${language.native})
${options.language === 'bilingual' ? '6. For bilingual mode: provide both Chinese and English versions for each title' : ''}

OUTPUT FORMAT (JSON):
{
  "titles": [
    {
      "title": "the title text",
      ${options.language === 'bilingual' ? '"englishTitle": "English version of title",' : ''}
      "explanation": "Brief explanation of why this title works with the poem",
      "category": "literary" or "platform"
    }
  ]
}

STYLE PREFERENCES: ${styles}
MOOD PREFERENCES: ${moods}
TITLE LENGTH: ${length}
USAGE SCENE: ${scene}`;

    const userPrompt = `Generate 6 creative poem titles for the following poem content or theme:

"""
${options.poemContent}
"""

Remember:
- 3 Literary titles (artistic, profound, for journals/anthologies)
- 3 Platform titles (catchy, viral-friendly, for social media)
- Match the requested style (${styles}) and mood (${moods})
- Keep titles around ${length}
- Each title needs a brief explanation
- Output in ${language.english} (${language.native})

Return ONLY valid JSON format as specified.`;

    return JSON.stringify({
        system: systemPrompt,
        user: userPrompt,
    });
}

export async function POST(req: Request) {
    try {
        const requestData = await req.json();
        console.log("=== Poem Title Generator Request ===", JSON.stringify(requestData, null, 2));

        const {
            poemContent,
            language = "zh",
            styles = [],
            moods = [],
            length = "medium",
            usageScene = "social_media",
            turnstileToken,
        } = requestData || {};

        // Validation
        if (!poemContent || poemContent.trim().length < 10) {
            console.log("Validation failed: poemContent is empty or too short");
            return respErr("Please provide poem content or theme (minimum 10 characters)");
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

        console.log("✓ Turnstile verification passed, proceeding with title generation");

        const apiKey = process.env.GRSAI_API_KEY;
        if (!apiKey) {
            return respErr("API KEY not found");
        }

        // Build prompt
        const options: PoemTitleGenerateOptions = {
            poemContent: poemContent.trim(),
            language,
            styles,
            moods,
            length,
            usageScene,
        };

        const promptData = JSON.parse(buildPrompt(options));

        console.log("=== Poem Title Generation Request ===");
        console.log("Content:", poemContent.substring(0, 100));
        console.log("Language:", language);
        console.log("Styles:", styles);
        console.log("Moods:", moods);

        const requestBody = {
            model: "gemini-2.5-flash",
            stream: true,
            messages: [
                { role: "system", content: promptData.system },
                { role: "user", content: promptData.user },
            ],
        };

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

        // Use TransformStream for streaming response
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        let chunkCount = 0;
        let buffer = "";

        const transformStream = new TransformStream({
            async transform(chunk, controller) {
                chunkCount++;
                const text = decoder.decode(chunk, { stream: true });
                console.log(`=== Chunk ${chunkCount} ===`, text.substring(0, 100));

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
                                if (content.trim()) {
                                    const escaped = content
                                        .replace(/\\/g, "\\\\")
                                        .replace(/"/g, '\\"')
                                        .replace(/\n/g, "\\n")
                                        .replace(/\r/g, "\\r")
                                        .replace(/\t/g, "\\t");

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
        console.log("Poem title generation failed:", e);
        return respErr("bad request: " + e);
    }
}
