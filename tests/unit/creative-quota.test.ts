import assert from "node:assert/strict";
import {
  CREATIVE_PAGE_KEYS,
  buildCreativeQuotaKey,
  buildCreativeMergeKey,
  buildLegacyCreativeQuotaKey,
  buildCreativeMigrationKey,
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

assert.equal(CREATIVE_PAGE_KEYS.length, 13);
assert.equal(
  buildCreativeQuotaKey("2026-07-14", "user:u1", "poem-generator"),
  "free-quota:2026-07-14:user:u1:poem-generator:creative"
);
assert.equal(
  buildCreativeMergeKey("2026-07-14", "visitor:v1", "user:u1", "poem-generator"),
  "free-quota:2026-07-14:merge:visitor:v1:user:u1:poem-generator:creative"
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
  "Daily free Creative quota reached. Please sign in to continue."
);
assert.equal(
  getCreativeQuotaLimitReachedMessage("zh"),
  "今日 Creative 免费额度已用完，请登录后继续。"
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
    cost: 5,
  }),
  false
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

console.log("creative quota core tests passed");
