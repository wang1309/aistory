# Creative Credit Paywall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open the existing paywall in the browser before a charged Creative-model generation starts when the user's known balance is insufficient.

**Architecture:** The quota-status route exposes server-resolved cost and current user balance alongside quota usage. A pure client-side decision helper makes the preflight rule testable, and `useCreativeQuotaPage` owns the fetched credit state, optimistic charged-generation deduction, and paywall trigger. All existing Creative generators call that shared guard immediately after their anonymous quota guard.

**Tech Stack:** Next.js route handlers, React hooks, TypeScript, Node test runner via `tsx`.

---

### Task 1: Define and test the shared preflight decision

**Files:**
- Modify: `src/lib/creative-quota-core.ts`
- Modify: `tests/unit/creative-quota.test.ts`

- [x] **Step 1: Write failing tests for all preflight outcomes**

```ts
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
```

Include false cases for a non-Creative model, free quota remaining, enough credits, and unknown balance.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `pnpm exec tsx tests/unit/creative-quota.test.ts`

Expected: failure because `shouldOptimisticallyGateCreativeCreditUsage` is not exported.

- [x] **Step 3: Implement the pure decision function**

```ts
export function shouldOptimisticallyGateCreativeCreditUsage({
  hasUser,
  selectedModel,
  used,
  limit,
  credits,
  cost,
}: {
  hasUser: boolean;
  selectedModel: string | null | undefined;
  used: number;
  limit: number;
  credits: number | null;
  cost: number | null;
}) {
  return hasUser && selectedModel === "creative" && used >= limit &&
    credits !== null && cost !== null && credits < cost;
}
```

- [x] **Step 4: Run the focused test to verify it passes**

Run: `pnpm exec tsx tests/unit/creative-quota.test.ts`

Expected: exit code 0.

### Task 2: Build the client-safe quota status payload

**Files:**
- Modify: `src/lib/creative-quota-core.ts`
- Modify: `tests/unit/creative-quota.test.ts`

- [x] **Step 1: Write a failing payload test**

```ts
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
```

Also assert that an unknown balance is absent from the payload.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `pnpm exec tsx tests/unit/creative-quota.test.ts`

Expected: failure because `buildCreativeQuotaClientStatus` is not exported.

- [x] **Step 3: Implement the pure payload builder**

```ts
export function buildCreativeQuotaClientStatus({ quota, creditCost, leftCredits }: {
  quota: CreativeQuotaStatus;
  creditCost: number;
  leftCredits: number | null;
}) {
  return {
    ...quota,
    creditCost,
    ...(leftCredits === null ? {} : { leftCredits }),
  };
}
```

- [x] **Step 4: Run the focused test to verify it passes**

Run: `pnpm exec tsx tests/unit/creative-quota.test.ts`

Expected: exit code 0.

- [x] **Step 5: Use the payload builder in the quota status route**

Modify `src/app/api/creative-quota/status/route.ts` to retrieve the signed-in
user's balance, resolve `SG_CREATIVE_COST` with the same five-credit default as
the charging gate, and pass those values to `buildCreativeQuotaClientStatus`.
The route retains its existing visitor cookie behavior.

### Task 3: Add the shared hook guard and local charged-credit accounting

**Files:**
- Modify: `src/hooks/useCreativeQuotaPage.ts`
- Modify: `tests/unit/creative-quota.test.ts`

- [x] **Step 1: Extend the failing unit test for post-success accounting**

Test the decision helper with an initial balance that can pay once and a reduced balance that cannot pay a second time after the free quota is exhausted.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `pnpm exec tsx tests/unit/creative-quota.test.ts`

Expected: failure until the hook consumes the server-provided cost after charged success.

- [x] **Step 3: Store status fields and expose `guardCreativeCreditQuota`**

Use the existing status fetch to set `leftCredits` and `creditCost` only when their values are numbers. Call the pure decision helper from `guardCreativeCreditQuota`; on true, show the existing insufficient-credit toast, set `paywallOpen`, and return true. Wrap `increment` so a successful charged Creative generation decreases `leftCredits` by `creditCost` without going below zero.

- [x] **Step 4: Run the focused test to verify it passes**

Run: `pnpm exec tsx tests/unit/creative-quota.test.ts`

Expected: exit code 0.

### Task 4: Wire every Creative generator to the preflight guard

**Files:**
- Modify: `src/components/blocks/backstory-generate/index.tsx`
- Modify: `src/components/blocks/bedtime-story-generate/index.tsx`
- Modify: `src/components/blocks/comic-generate/index.tsx`
- Modify: `src/components/blocks/dialogue-generate/index.tsx`
- Modify: `src/components/blocks/dnd-backstory-generate/index.tsx`
- Modify: `src/components/blocks/fanfic-generate/tabbed-fanfic-generate.tsx`
- Modify: `src/components/blocks/fantasy-generate/index.tsx`
- Modify: `src/components/blocks/incorrect-quote-generate/index.tsx`
- Modify: `src/components/blocks/plot-generate/index.tsx`
- Modify: `src/components/blocks/poem-generate/index.tsx`
- Modify: `src/components/blocks/romance-story-generate/index.tsx`
- Modify: `src/components/blocks/tiktok-comment-generate/index.tsx`
- Modify: `src/components/blocks/story-generate/index.tsx`
- Modify: `tests/creative-credit-paywall-wiring.test.ts`

- [x] **Step 1: Write a failing wiring test**

```ts
assert.match(blockSource, /guardCreativeCreditQuota/);
```

Iterate every registered Creative generator and assert it invokes the new guard before the network request.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `pnpm exec tsx tests/creative-credit-paywall-wiring.test.ts`

Expected: each generator is reported as missing `guardCreativeCreditQuota`.

- [x] **Step 3: Add the guard directly after each anonymous quota guard**

```ts
if (
  creativeQuota.guardAnonymousCreativeQuota({ selectedModel, message }) ||
  creativeQuota.guardCreativeCreditQuota({ selectedModel, message })
) {
  return;
}
```

For the story generator, replace the page-local `CREATIVE_COST` credit check with `useCreativeQuotaPage("story-generator")` and render the shared `CreativeQuotaPaywall`.

- [x] **Step 4: Run the focused test to verify it passes**

Run: `pnpm exec tsx tests/creative-credit-paywall-wiring.test.ts`

Expected: exit code 0.

### Task 5: Verify regression coverage and production compilation

**Files:**
- Modify: `docs/superpowers/plans/2026-07-18-creative-credit-paywall.md`

- [x] **Step 1: Run relevant tests**

Run: `pnpm exec tsx tests/unit/creative-quota.test.ts && pnpm exec tsx tests/creative-credit-paywall-wiring.test.ts && pnpm exec tsx tests/incorrect-quote-generator-creative.test.ts && pnpm exec tsx tests/tiktok-comment-generator-creative.test.ts`

Expected: all tests pass.

- [x] **Step 2: Run static checks**

Run: `pnpm lint && pnpm build`

Expected: both commands exit with code 0.

- [x] **Step 3: Commit the implementation**

```bash
git add src/app/api/creative-quota/status/route.ts src/components/blocks src/hooks/useCreativeQuotaPage.ts src/lib/creative-quota-core.ts tests docs/superpowers/plans/2026-07-18-creative-credit-paywall.md
git commit -m "feat: preflight creative credit paywall"
```
