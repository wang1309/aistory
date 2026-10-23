import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { CREATIVE_PAGE_KEYS } from "@/lib/creative-quota-core";

const root = process.cwd();

function source(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("story prompt generator is a quota-enabled page", () => {
  assert.ok(CREATIVE_PAGE_KEYS.includes("story-prompt-generator"));
});

test("story prompt route gates standard/creative usage through the page quota", () => {
  const route = source("src/app/api/story-prompt/route.ts");

  assert.match(
    route,
    /prepareCreativeQuota\(\{[\s\S]*?pageKey:\s*"story-prompt-generator"/
  );
  assert.match(route, /creativeQuotaErrorResponse\(quotaGate\)/);
  assert.match(route, /commitCreativeQuotaCharge\(quotaGate\)/);
  assert.match(route, /withCreativeVisitorCookie\(/);
  assert.match(
    route,
    /model === "fast" \|\| model === "standard" \|\| model === "creative"/
  );
});

test("story prompt page wires the quota hint, paywall, guards, and increment", () => {
  const page = source("src/components/blocks/story-prompt-generate/index.tsx");

  assert.match(
    page,
    /useCreativeQuotaPage\("story-prompt-generator"\)/
  );
  assert.match(
    page,
    /<CreativeQuotaHint[\s\S]*?pageKey="story-prompt-generator"/
  );
  assert.match(
    page,
    /<CreativeQuotaPaywall[\s\S]*?sourcePage="story-prompt-generator"/
  );
  assert.match(page, /guardAnonymousCreativeQuota\(/);
  assert.match(page, /guardCreativeCreditQuota\(/);
  assert.match(page, /handleQuotaError\(response\.status, errorData\)/);
  assert.match(page, /creativeQuota\.increment\(selectedModel\)/);
});
