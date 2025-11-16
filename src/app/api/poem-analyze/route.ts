import { respErr } from "@/lib/resp";
import { buildPoemAnalysisPrompt } from "@/lib/poem-prompt-builder";
import type { PoemAnalyzeOptions, PoemAnalysis } from "@/types/poem";

/**
 * Poem Analysis API
 * 分析诗歌的意象、韵律、修辞、情感和主题
 */
export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    console.log("=== Poem Analysis Request ===", JSON.stringify(requestData, null, 2));

    const { poemContent, poemType, locale } = requestData || {};

    // 参数验证
    if (!poemContent || poemContent.trim().length === 0) {
      console.log("Validation failed: poemContent is empty");
      return respErr("Please provide poem content to analyze");
    }

    if (!poemType) {
      console.log("Validation failed: poemType is empty");
      return respErr("Please provide poem type");
    }

    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      return respErr("API KEY not found");
    }

    // 使用 poem-prompt-builder 构建分析提示词
    const analysisPrompt = buildPoemAnalysisPrompt(poemContent, poemType, locale || 'en');
    console.log("=== Generated Analysis Prompt ===", analysisPrompt.substring(0, 300) + "...");

    // 使用快速模型进行分析
    const requestBody = {
      model: "gemini-2.5-flash", // 使用快速模型
      stream: false, // 分析不需要流式响应
      messages: [
        {
          role: "system",
          content: "You are an expert poetry critic and literary analyst with deep knowledge of various poetic forms and literary devices."
        },
        { role: "user", content: analysisPrompt },
      ],
    };

    console.log("=== Request to GRSAI API (Analysis) ===");

    // 调用 GRSAI API（非流式响应）
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

    const result = await response.json();
    console.log("=== API Result ===", JSON.stringify(result, null, 2));

    const analysisText = result.choices?.[0]?.message?.content;

    if (!analysisText) {
      console.log("No analysis content returned");
      return respErr("Failed to generate analysis");
    }

    // 尝试解析 JSON
    let analysis: PoemAnalysis;
    try {
      // 提取 JSON 部分（可能被 markdown 代码块包裹）
      let jsonText = analysisText.trim();

      // 移除可能的 markdown 代码块标记
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      analysis = JSON.parse(jsonText);
      console.log("=== Parsed Analysis ===", JSON.stringify(analysis, null, 2));

      // 验证分析结果结构
      if (!analysis.imagery || !analysis.rhymeAnalysis || !analysis.rhetoricalDevices ||
          !analysis.emotionalTone || !analysis.themeInterpretation) {
        throw new Error("Invalid analysis structure");
      }

    } catch (parseError) {
      console.error("Failed to parse analysis JSON:", parseError);
      console.log("Raw analysis text:", analysisText);

      // 如果无法解析，返回默认结构
      analysis = {
        imagery: ["分析生成失败"],
        rhymeAnalysis: "无法解析分析结果",
        rhetoricalDevices: ["解析错误"],
        emotionalTone: "未知",
        themeInterpretation: "分析失败，请重试"
      };
    }

    // 返回成功结果
    return new Response(
      JSON.stringify({
        success: true,
        analysis
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  } catch (e) {
    console.error("Poem analysis failed:", e);
    return respErr("bad request: " + e);
  }
}
