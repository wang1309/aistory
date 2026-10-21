/**
 * APIMart compatibility probe.
 *
 * Usage:
 *   APIMART_API_KEY=sk-... npx tsx scripts/apimart-probe.ts
 *   # or put APIMART_API_KEY in .env.local and run `pnpm llm:probe`
 *
 * Read-only: it never touches application data or the database.
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env.development" });
loadEnv();

const baseUrl = (process.env.APIMART_BASE_URL || "https://api.apimart.ai").replace(
  /\/+$/,
  ""
);
const apiKey = (process.env.APIMART_API_KEY || "").trim();
const model = (process.env.AI_MODEL_STANDARD || "gemini-2.5-flash-lite").trim();
const timeoutMs = Number(process.env.PROBE_TIMEOUT_MS) || 180_000;

function maskKey(value: string) {
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function jsonKeys(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }
  return Object.keys(payload as Record<string, unknown>);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrap(payload: unknown) {
  if (!isRecord(payload)) return null;
  if (isRecord(payload.data) && Array.isArray(payload.data.choices)) {
    return payload.data;
  }
  return payload;
}

async function post(path: string, body: Record<string, unknown>) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave as text
  }

  return { response, text, json, latencyMs: Date.now() - started };
}

async function probeModels() {
  console.log("\n=== 1) GET /v1/models ===");
  const response = await fetch(`${baseUrl}/v1/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  console.log("status:", response.status);

  if (!response.ok) {
    console.log("body:", text.slice(0, 300));
    return;
  }

  const data = isRecord(json) && Array.isArray(json.data) ? json.data : [];
  const ids = data
    .map((item) => (isRecord(item) && typeof item.id === "string" ? item.id : ""))
    .filter(Boolean);

  console.log("models:", ids.length);

  for (const needle of [
    "gemini-3.1-flash-lite",
    "gemini-3-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
  ]) {
    console.log(`  ${ids.includes(needle) ? "yes" : "no "} ${needle}`);
  }

  console.log("gemini models:", ids.filter((id) => id.includes("gemini")).slice(0, 40));
}

async function probeNonStream(path: string, label: string) {
  console.log(`\n=== ${label} ===`);
  const { response, text, json, latencyMs } = await post(path, {
    model,
    stream: false,
    max_tokens: 64,
    messages: [{ role: "user", content: "Reply with the single word: ok" }],
  });

  console.log("status:", response.status, `(${latencyMs}ms)`);

  if (!response.ok) {
    console.log("body:", text.slice(0, 400));
    return;
  }

  const body = unwrap(json);
  const choice = body && Array.isArray(body.choices) ? body.choices[0] : null;
  const message = isRecord(choice) && isRecord(choice.message) ? choice.message : null;

  console.log("top-level keys:", jsonKeys(json));
  console.log("wrapped in { code, data }:", isRecord(json) && isRecord(json.data));
  console.log("code field:", isRecord(json) ? json.code : undefined);
  console.log("message.content:", message?.content);
  console.log("usage:", body?.usage);
}

async function probeStream() {
  console.log("\n=== 4) POST /v1/chat/completions (stream:true) ===");
  const started = Date.now();
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 64,
      messages: [{ role: "user", content: "Count from 1 to 5." }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  console.log("status:", response.status);
  console.log("content-type:", response.headers.get("content-type"));

  if (!response.ok || !response.body) {
    console.log("body:", (await response.text()).slice(0, 400));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  let events = 0;
  let firstBytesAt: number | null = null;
  let done = false;

  while (true) {
    const { done: finished, value } = await reader.read();
    if (finished) break;
    if (firstBytesAt === null) firstBytesAt = Date.now() - started;
    raw += decoder.decode(value, { stream: true });
    events = (raw.match(/data:/g) || []).length;
    if (raw.length > 16_000) {
      done = true;
      break;
    }
  }

  if (!done) {
    raw += decoder.decode();
  }

  const lines = raw.split("\n").filter((line) => line.trim().length > 0);
  console.log("first byte:", firstBytesAt === null ? "n/a" : `${firstBytesAt}ms`);
  console.log("first lines:");
  for (const line of lines.slice(0, 6)) {
    console.log("  ", line.slice(0, 400));
  }
  console.log("last lines:");
  for (const line of lines.slice(-3)) {
    console.log("  ", line.slice(0, 400));
  }
  console.log("data events captured:", events);
  console.log("has usage:", /"usage"\s*:/.test(raw));
  console.log("has [DONE]:", raw.includes("[DONE]"));
  console.log("wrapped chunks:", /"code"\s*:\s*200/.test(raw));
}

async function probeResponseFormat() {
  console.log("\n=== 5) response_format: json_object ===");
  const { response, text, latencyMs } = await post("/v1/chat/completions", {
    model,
    stream: false,
    max_tokens: 128,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: 'Return exactly this JSON: {"ok": true}',
      },
    ],
  });

  console.log("status:", response.status, `(${latencyMs}ms)`);
  console.log("body:", text.slice(0, 500));
}

async function main() {
  console.log("APIMart compatibility probe");
  console.log("base:", baseUrl);
  console.log("model:", model);
  console.log("key:", apiKey ? maskKey(apiKey) : "(missing)");

  if (!apiKey) {
    console.error("\nAPIMART_API_KEY is required. Set it in .env.local or the shell.");
    process.exitCode = 1;
    return;
  }

  await probeModels();

  for (const [label, step] of [
    ["non-stream /v1", () => probeNonStream("/v1/chat/completions", "2) POST /v1/chat/completions (stream:false)")],
    ["non-stream /api/v1", () => probeNonStream("/api/v1/chat/completions", "3) POST /api/v1/chat/completions (stream:false)")],
    ["stream", probeStream],
    ["response_format", probeResponseFormat],
  ] as const) {
    try {
      await step();
    } catch (error) {
      console.log(`\n[${label}] probe failed:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(
    "\nDone. If /api/v1 works but /v1 fails for non-stream, set " +
      "APIMART_CHAT_PATH_NOSTREAM=/api/v1/chat/completions."
  );
  console.log(
    "\nDone. Non-stream routes use the official stream:false path by default; " +
      "set AI_NONSTREAM_VIA_STREAM=true only if it is too slow."
  );
  console.log("Record the findings in docs/llm-provider-compat.md.");
}

main().catch((error) => {
  console.error("probe failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
