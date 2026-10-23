import assert from "node:assert/strict";
import test from "node:test";
import {
  CREATIVE_PAGE_KEYS,
  QUOTA_TIERS,
  buildCreativeQuotaKey,
  buildCreativeMergeKey,
  buildLegacyCreativeQuotaKey,
  buildCreativeMigrationKey,
  buildQuotaKey,
  buildQuotaMergeKey,
  isQuotaTier,
  resolveQuotaTier,
  mergeUsedCounts,
  migrateCreativeUsedCount,
  incrementCreativeUsedCount,
  getCreativeQuotaStatus,
  formatCreativeQuotaHint,
  getCreativeQuotaLimitReachedMessage,
  buildCreativeQuotaClientStatus,
  shouldOptimisticallyGateCreativeAnonymousUsage,
  shouldOptimisticallyGateCreativeCreditUsage,
} from "@/lib/creative-quota-core";
import { getQuotaDailyLimit } from "@/lib/free-quota";

assert.equal(CREATIVE_PAGE_KEYS.length, 26);
assert.deepEqual([...QUOTA_TIERS], ["standard", "creative"]);
assert.equal(resolveQuotaTier("fast"), null);
assert.equal(resolveQuotaTier("standard"), "standard");
assert.equal(resolveQuotaTier("creative"), "creative");
assert.equal(resolveQuotaTier("unknown-model"), "standard");
assert.equal(resolveQuotaTier(undefined), null);
assert.equal(isQuotaTier("standard"), true);
assert.equal(isQuotaTier("creative"), true);
assert.equal(isQuotaTier("fast"), false);
assert.equal(
  buildCreativeQuotaKey("2026-07-14", "user:u1", "poem-generator"),
  "free-quota:2026-07-14:user:u1:poem-generator:creative"
);
test("Paragraph Rewriter uses a page-scoped creative quota key", () => {
  assert.ok(CREATIVE_PAGE_KEYS.includes("paragraph-rewriter"));
  assert.equal(
    buildCreativeQuotaKey("2026-09-21", "visitor-123", "paragraph-rewriter"),
    "free-quota:2026-09-21:visitor-123:paragraph-rewriter:creative"
  );
});
test("AI Humanizer uses a page-scoped creative quota key", () => {
  assert.ok(CREATIVE_PAGE_KEYS.includes("ai-humanizer"));
  assert.equal(
    buildCreativeQuotaKey("2026-09-23", "visitor-123", "ai-humanizer"),
    "free-quota:2026-09-23:visitor-123:ai-humanizer:creative"
  );
});
test("Story Prompt Generator uses a page-scoped quota key", () => {
  assert.ok(CREATIVE_PAGE_KEYS.includes("story-prompt-generator"));
  assert.equal(
    buildCreativeQuotaKey(
      "2026-10-23",
      "visitor-123",
      "story-prompt-generator"
    ),
    "free-quota:2026-10-23:visitor-123:story-prompt-generator:creative"
  );
});
assert.equal(
  buildCreativeMergeKey("2026-07-14", "visitor:v1", "user:u1", "poem-generator"),
  "free-quota:2026-07-14:merge:visitor:v1:user:u1:poem-generator:creative"
);
assert.equal(
  buildQuotaKey("2026-10-23", "user:u1", "story-generator", "standard"),
  "free-quota:2026-10-23:user:u1:story-generator:standard"
);
assert.equal(
  buildQuotaKey("2026-10-23", "visitor:v1", "plot-generator", "creative"),
  "free-quota:2026-10-23:visitor:v1:plot-generator:creative"
);
assert.equal(
  buildQuotaMergeKey(
    "2026-10-23",
    "visitor:v1",
    "user:u1",
    "story-generator",
    "standard"
  ),
  "free-quota:2026-10-23:merge:visitor:v1:user:u1:story-generator:standard"
);
assert.notEqual(
  buildQuotaKey("2026-10-23", "user:u1", "story-generator", "standard"),
  buildQuotaKey("2026-10-23", "user:u1", "story-generator", "creative")
);
assert.equal(
  buildLegacyCreativeQuotaKey("2026-07-14", "user:u1"),
  "free-quota:2026-07-14:user:u1:creative"
);
assert.equal(
  buildCreativeMigrationKey("2026-07-14", "user:u1"),
  "free-quota:2026-07-14:migration:user:u1:story-generator:creative"
);
assert.equal(mergeUsedCounts(1, 2, 3), 3);
assert.equal(mergeUsedCounts(3, 1, 3), 3);
assert.equal(migrateCreativeUsedCount(2, 1, 3), 2);
assert.equal(migrateCreativeUsedCount(4, 0, 3), 3);
assert.equal(incrementCreativeUsedCount(2, 3), 3);
assert.equal(incrementCreativeUsedCount(3, 3), 3);
assert.notEqual(
  buildCreativeQuotaKey("2026-07-14", "user:u1", "poem-generator"),
  buildCreativeQuotaKey("2026-07-14", "user:u1", "plot-generator")
);
assert.deepEqual(getCreativeQuotaStatus(1, 3), {
  used: 1,
  limit: 3,
  remaining: 2,
  mode: "free",
});
assert.deepEqual(getCreativeQuotaStatus(3, 3), {
  used: 3,
  limit: 3,
  remaining: 0,
  mode: "credits",
});
assert.equal(
  shouldOptimisticallyGateCreativeAnonymousUsage({
    hasUser: false,
    selectedModel: "creative",
    used: 3,
    limit: 3,
  }),
  true
);
assert.equal(
  shouldOptimisticallyGateCreativeAnonymousUsage({
    hasUser: true,
    selectedModel: "creative",
    used: 3,
    limit: 3,
  }),
  false
);
assert.equal(
  shouldOptimisticallyGateCreativeAnonymousUsage({
    hasUser: false,
    selectedModel: "standard",
    used: 3,
    limit: 3,
  }),
  true
);
assert.equal(
  shouldOptimisticallyGateCreativeAnonymousUsage({
    hasUser: false,
    selectedModel: "fast",
    used: 3,
    limit: 3,
  }),
  false
);
assert.equal(
  formatCreativeQuotaHint({ locale: "en", used: 1, limit: 3 }),
  "Used today: 1/3 · Remaining today: 2/3"
);
assert.equal(
  formatCreativeQuotaHint({ locale: "zh", used: 3, limit: 3 }),
  "今日已用：3/3 · 今日剩余：0/3"
);
assert.equal(
  getCreativeQuotaLimitReachedMessage("en"),
  "Daily free quota reached. Please sign in to continue."
);
assert.equal(
  getCreativeQuotaLimitReachedMessage("zh"),
  "今日免费额度已用完，请登录后继续。"
);
assert.equal(
  shouldOptimisticallyGateCreativeAnonymousUsage({
    hasUser: false,
    selectedModel: "creative",
    used: 2,
    limit: 3,
  }),
  false
);
assert.equal(
  shouldOptimisticallyGateCreativeCreditUsage({
    hasUser: true,
    selectedModel: "creative",
    used: 3,
    limit: 3,
    credits: 4,
    cost: 5,
  }),
  true
);
assert.equal(
  shouldOptimisticallyGateCreativeCreditUsage({
    hasUser: true,
    selectedModel: "standard",
    used: 3,
    limit: 3,
    credits: 0,
    cost: 3,
  }),
  true
);
assert.equal(
  shouldOptimisticallyGateCreativeCreditUsage({
    hasUser: true,
    selectedModel: "creative",
    used: 2,
    limit: 3,
    credits: 0,
    cost: 5,
  }),
  false
);
assert.equal(
  shouldOptimisticallyGateCreativeCreditUsage({
    hasUser: true,
    selectedModel: "creative",
    used: 3,
    limit: 3,
    credits: 5,
    cost: 5,
  }),
  false
);
assert.equal(
  shouldOptimisticallyGateCreativeCreditUsage({
    hasUser: true,
    selectedModel: "creative",
    used: 3,
    limit: 3,
    credits: null,
    cost: 5,
  }),
  false
);
assert.deepEqual(
  buildCreativeQuotaClientStatus({
    quota: getCreativeQuotaStatus(3, 3),
    creditCost: 5,
    leftCredits: 4,
  }),
  {
    used: 3,
    limit: 3,
    remaining: 0,
    mode: "credits",
    creditCost: 5,
    leftCredits: 4,
  }
);
assert.deepEqual(
  buildCreativeQuotaClientStatus({
    quota: getCreativeQuotaStatus(3, 3),
    creditCost: 5,
    leftCredits: null,
  }),
  {
    used: 3,
    limit: 3,
    remaining: 0,
    mode: "credits",
    creditCost: 5,
  }
);

test("quota limits are tier-specific and env-configurable", () => {
  const originalStandard = process.env.FREE_STANDARD_DAILY_LIMIT;
  const originalCreative = process.env.FREE_CREATIVE_DAILY_LIMIT;

  try {
    process.env.FREE_STANDARD_DAILY_LIMIT = "7";
    process.env.FREE_CREATIVE_DAILY_LIMIT = "2";
    assert.equal(getQuotaDailyLimit("standard"), 7);
    assert.equal(getQuotaDailyLimit("creative"), 2);

    process.env.FREE_STANDARD_DAILY_LIMIT = "invalid";
    assert.equal(getQuotaDailyLimit("standard"), 3);
  } finally {
    if (originalStandard === undefined) {
      delete process.env.FREE_STANDARD_DAILY_LIMIT;
    } else {
      process.env.FREE_STANDARD_DAILY_LIMIT = originalStandard;
    }
    if (originalCreative === undefined) {
      delete process.env.FREE_CREATIVE_DAILY_LIMIT;
    } else {
      process.env.FREE_CREATIVE_DAILY_LIMIT = originalCreative;
    }
  }
});

console.log("creative quota core tests passed");
