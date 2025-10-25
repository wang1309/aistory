import { respErr } from "@/lib/resp";

interface BookTitleRequest {
  description: string;
  genre: string;
  tone: string;
  style?: string;
  locale?: string;
  turnstileToken?: string;
}

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  console.log("=== Turnstile Verification Debug (Book Title Gen) ===");
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

// Map genre keys to display names
const genreMap: Record<string, string> = {
  fiction: "Fiction",
  non_fiction: "Non-Fiction",
  fantasy: "Fantasy",
  science_fiction: "Science Fiction",
  romance: "Romance",
  mystery: "Mystery & Thriller",
  horror: "Horror",
  historical: "Historical Fiction",
  biography: "Biography & Memoir",
  self_help: "Self-Help & Personal Development",
  business: "Business & Economics",
  young_adult: "Young Adult",
  children: "Children's Literature",
  poetry: "Poetry",
  drama: "Drama & Plays",
  crime: "Crime & Detective",
  adventure: "Adventure",
  literary: "Literary Fiction",
  psychological: "Psychological",
  paranormal: "Paranormal & Supernatural",
};

// Map tone keys to display names
const toneMap: Record<string, string> = {
  dark: "Dark & Mysterious",
  light: "Light & Uplifting",
  humorous: "Humorous & Witty",
  dramatic: "Dramatic & Intense",
  romantic: "Romantic & Passionate",
  suspenseful: "Suspenseful & Thrilling",
  inspirational: "Inspirational & Motivational",
  melancholic: "Melancholic & Reflective",
  whimsical: "Whimsical & Playful",
  serious: "Serious & Thought-Provoking",
  edgy: "Edgy & Bold",
  nostalgic: "Nostalgic & Sentimental",
  mysterious: "Mysterious & Enigmatic",
  epic: "Epic & Grand",
  intimate: "Intimate & Personal",
};

// Map style keys to display names
const styleMap: Record<string, string> = {
  classic: "Classic",
  modern: "Modern",
  dramatic: "Dramatic",
  single_word: "Single Word",
  question: "Question",
  essay: "Essay",
  research_paper: "Research Paper",
  marketing: "Marketing",
  email_subject: "Email Subject",
  blog: "Blog",
  newspaper: "Newspaper",
  journal: "Journal",
};

// Language name mapping for output language instruction
const languageNames: Record<string, { native: string; english: string }> = {
  'en': { native: 'English', english: 'English' },
  'zh': { native: '中文', english: 'Chinese' },
  'ja': { native: '日本語', english: 'Japanese' },
  'ko': { native: '한국어', english: 'Korean' },
  'de': { native: 'Deutsch', english: 'German' },
  'es': { native: 'Español', english: 'Spanish' },
  'fr': { native: 'Français', english: 'French' },
  'pt': { native: 'Português', english: 'Portuguese' },
  'ru': { native: 'Русский', english: 'Russian' },
  'ar': { native: 'العربية', english: 'Arabic' },
  'hi': { native: 'हिन्दी', english: 'Hindi' },
  'it': { native: 'Italiano', english: 'Italian' },
};

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    console.log("=== Received request data ===", JSON.stringify(requestData, null, 2));

    const { description, genre, tone, style, locale = "en", turnstileToken } = requestData || {};
    console.log("=== Extracted params ===", { description, genre, tone, style, locale, turnstileToken: turnstileToken ? "Present" : "Missing" });

    // Validation
    if (!description || description.trim().length < 10) {
      console.log("Validation failed: description is empty or too short");
      return respErr("Description is required and must be at least 10 characters");
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

    // Map genre, tone, and style to display names
    const genreDisplay = genre && genre !== "none" ? (genreMap[genre] || genre) : undefined;
    const toneDisplay = tone && tone !== "none" ? (toneMap[tone] || tone) : undefined;
    const styleDisplay = style && style !== "none" ? (styleMap[style] || style) : undefined;

    // Get target language for output
    const currentLanguage = languageNames[locale] || languageNames['en'];

    // Build the prompt
    const systemPrompt = `You are a creative book title generator. Your task is to generate compelling, unique, and marketable book titles based on the user's description.

Generate exactly 8 book titles that:
- Are creative, memorable, and marketable
${genreDisplay ? `- Match the ${genreDisplay} genre` : ""}
${toneDisplay ? `- Have a ${toneDisplay} tone` : ""}
${styleDisplay ? `- Follow the "${styleDisplay}" style` : ""}
- Are appropriate for the target audience
- Avoid clichés and overused phrases
- Range from 1-7 words in length
- Could realistically appear on a bestseller list

IMPORTANT: Generate all titles in ${currentLanguage.english} language (${currentLanguage.native}).
IMPORTANT: Return ONLY the titles, one per line, without numbering, bullet points, or any additional commentary.`;

    const userPrompt = `Generate 8 creative book titles for:

Book Description: ${description.trim()}
${genreDisplay ? `Genre: ${genreDisplay}` : ""}
${toneDisplay ? `Tone: ${toneDisplay}` : ""}
${styleDisplay ? `Title Style: ${styleDisplay}` : ""}

IMPORTANT: All titles must be in ${currentLanguage.english} (${currentLanguage.native}).
Return only the titles, one per line.`;

    console.log("=== Book Title Generation Request ===");
    console.log("Description:", description.substring(0, 100));
    console.log("Genre:", genreDisplay || "Any");
    console.log("Tone:", toneDisplay || "Any");
    console.log("Style:", styleDisplay || "None");
    console.log("Output Language:", `${currentLanguage.english} (${currentLanguage.native})`);

    const requestBody = {
      model: "gemini-2.5-flash",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
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

    console.log("Title generation started..." + response);

    if (!response.body) {
      return respErr("No response body from API");
    }

    // Use TransformStream for better Cloudflare Workers compatibility
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let chunkCount = 0;
    let buffer = ""; // Buffer for incomplete lines

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        chunkCount++;
        const text = decoder.decode(chunk, { stream: true });
        console.log(`=== Chunk ${chunkCount} ===`, text.substring(0, 100));

        // Add to buffer
        buffer += text;

        // Split by newlines but keep the last incomplete line in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep last incomplete line

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

                // Send all content directly
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
        // Process any remaining buffer
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
    console.log("Book title generation failed:", e);
    return respErr("bad request: " + e);
  }
}
