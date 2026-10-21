/**
 * Smoke-test the app's LLM client against the configured provider.
 *
 *   pnpm llm:smoke
 *
 * Prints status, latency, content and whether usage/SSE framing survived.
 * Never prints the API key.
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env.development" });
loadEnv();

import { fetchChatCompletion } from "@/lib/llm/client";

const messages = [{ role: "user" as const, content: "Reply with exactly: ok" }];

async function run() {
  console.log("provider:", process.env.AI_PROVIDER || "grsai (default)");
  console.log("base:", process.env.APIMART_BASE_URL || "https://api.apimart.ai");
  console.log("model:", process.env.AI_MODEL_STANDARD || "(provider default)");
  console.log(
    "non-stream via SSE aggregation:",
    process.env.AI_NONSTREAM_VIA_STREAM === "true"
  );

  console.log("\n=== non-stream route (official stream:false) ===");
  const startedAt = Date.now();
  const response = await fetchChatCompletion({
    body: { messages, stream: false, max_tokens: 32 },
  });
  const text = await response.text();
  console.log("status:", response.status, `(${Date.now() - startedAt}ms)`);
  console.log("body:", text.slice(0, 400));

  console.log("\n=== fast tier ===");
  const fastStartedAt = Date.now();
  const fastResponse = await fetchChatCompletion({
    body: {
      model: "fast",
      messages: [{ role: "user", content: "Write one short sentence about spring." }],
      stream: false,
      max_tokens: 512,
    },
  });
  const fastText = await fastResponse.text();
  console.log("status:", fastResponse.status, `(${Date.now() - fastStartedAt}ms)`);
  console.log("body:", fastText.slice(0, 400));

  console.log("\n=== non-stream JSON route (response_format) ===");
  const jsonStartedAt = Date.now();
  const jsonResponse = await fetchChatCompletion({
    body: {
      messages: [
        { role: "user", content: 'Return exactly this JSON object: {"ok": true}' },
      ],
      stream: false,
      max_tokens: 64,
      response_format: { type: "json_object" },
    },
  });
  const jsonText = await jsonResponse.text();
  console.log("status:", jsonResponse.status, `(${Date.now() - jsonStartedAt}ms)`);
  console.log("body:", jsonText.slice(0, 400));

  console.log("\n=== streaming route ===");
  const streamStartedAt = Date.now();
  const streamResponse = await fetchChatCompletion({
    body: { messages, stream: true, max_tokens: 32 },
  });

  if (!streamResponse.ok || !streamResponse.body) {
    console.log("status:", streamResponse.status, await streamResponse.text());
    return;
  }

  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder();
  let firstLineAt: number | null = null;
  let buffer = "";
  let done = false;
  let usage = false;

  while (true) {
    const { done: finished, value } = await reader.read();
    if (finished) break;
    if (firstLineAt === null) firstLineAt = Date.now() - streamStartedAt;
    buffer += decoder.decode(value, { stream: true });
    usage = usage || /"usage"\s*:\s*\{/.test(buffer);
    done = done || buffer.includes("[DONE]");
    if (buffer.length > 8000) break;
  }

  console.log("first line:", firstLineAt === null ? "n/a" : `${firstLineAt}ms`);
  console.log("has usage:", usage);
  console.log("has [DONE]:", done);
  console.log("first lines:");
  for (const line of buffer.split("\n").filter(Boolean).slice(0, 4)) {
    console.log("  ", line.slice(0, 300));
  }
}

run().catch((error) => {
  console.error("smoke failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
