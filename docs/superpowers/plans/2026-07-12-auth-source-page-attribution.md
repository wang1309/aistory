# Auth Source Page Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stable generator-level `source_page` attribution to the authentication funnel without changing OAuth behavior or existing `source` semantics.

**Architecture:** Extend `AuthIntent`, pending auth storage, and analytics payloads with an optional stable `source_page` slug. Pass the value from generator entry points through `SignModal` and `SignForm`, then consume it on `auth_success` and `post_auth_action_resumed`. Keep `source` as the existing category for dashboard compatibility.

**Tech Stack:** Next.js 15, React 19, TypeScript, NextAuth, OpenPanel, Node test runner.

---

## Files and Responsibilities

- Modify `src/lib/auth-funnel.ts`: add `AuthSourcePage`, `sourcePage` to intents and pending attempts, and include `source_page` in sanitized analytics payloads.
- Modify `src/types/context.d.ts`: retain the typed `AuthIntent` API with the new optional attribution field.
- Modify `src/components/sign/form.tsx`: persist and send `source_page` for provider-click events.
- Modify `src/components/sign/modal.tsx`: pass `authIntent.sourcePage` to the form and modal lifecycle events.
- Modify `src/contexts/app.tsx`: carry `source_page` into `auth_success`.
- Modify `src/components/ai-write/workbench/index.tsx`: carry source page into `post_auth_action_resumed`.
- Modify generator components: pass stable slugs to `requireAuth` for save and continue actions.
- Add `tests/auth-source-page.test.ts`: test source-page normalization and payload sanitization.
- Add `tests/auth-source-page-wiring.test.ts`: assert all agreed generators and auth UI wire the field.

## Task 1: Extend the source-page contract

**Files:**
- Modify: `src/lib/auth-funnel.ts`
- Test: `tests/auth-source-page.test.ts`

- [ ] **Step 1: Write failing tests**

Test that `normalizeAuthIntent({ source: "ai_write", sourcePage: "story-generator" })` preserves the slug, and that `buildAuthTrackingPayload` emits `source_page` while ignoring unrelated metadata.

- [ ] **Step 2: Run the focused test**

Run: `pnpm exec tsx --test tests/auth-source-page.test.ts`

Expected: FAIL because `sourcePage` is not in the contract.

- [ ] **Step 3: Implement the contract**

Add:

```ts
export type AuthSourcePage =
  | "story-generator"
  | "backstory-generator"
  | "fanfic-generator"
  | "dialogue-generator"
  | "dnd-backstory-generator"
  | "plot-generator"
  | "poem-generator"
  | "fantasy-generator";
```

Add optional `sourcePage?: AuthSourcePage` to `AuthIntent`, `AuthIntentInput`, and `PendingAuthAttempt`. Include it as `source_page` in `buildAuthTrackingPayload`.

- [ ] **Step 4: Run the focused test**

Run: `pnpm exec tsx --test tests/auth-source-page.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/lib/auth-funnel.ts && git add -f tests/auth-source-page.test.ts && git commit -m "feat: add auth source page attribution"`

## Task 2: Propagate source page through auth UI and success tracking

**Files:**
- Modify: `src/components/sign/form.tsx`
- Modify: `src/components/sign/modal.tsx`
- Modify: `src/contexts/app.tsx`
- Modify: `src/components/ai-write/workbench/index.tsx`
- Test: `tests/auth-source-page-wiring.test.ts`

- [ ] **Step 1: Write failing wiring tests**

Assert that:

```text
SignForm writes source_page to pending auth and tracking payloads.
SignModal passes authIntent.sourcePage to SignForm and lifecycle payloads.
AppContext includes sourcePage in auth_success.
AI Write includes source_page in post_auth_action_resumed.
```

- [ ] **Step 2: Run the focused test**

Run: `pnpm exec tsx --test tests/auth-source-page-wiring.test.ts`

Expected: FAIL because the UI and success event do not yet consume `sourcePage`.

- [ ] **Step 3: Implement propagation**

Use `sourcePage` internally and emit the analytics key `source_page`. Keep `source` and `action` unchanged. Do not add source page values to the browser storage payload unless the provider click needs them for the later success event; if stored, validate them through the typed contract and the existing 15-minute expiry.

- [ ] **Step 4: Run focused tests and type-check**

Run: `pnpm exec tsx --test tests/auth-source-page-wiring.test.ts && pnpm exec tsc --noEmit`

Expected: the new wiring tests pass; type-check may report only the repository's existing ignored-test errors, which must be recorded separately from changed source files.

- [ ] **Step 5: Commit**

Run: `git add src/components/sign src/contexts/app.tsx src/components/ai-write/workbench/index.tsx && git add -f tests/auth-source-page-wiring.test.ts && git commit -m "feat: propagate auth source page"`

## Task 3: Migrate generator entry points

**Files:**
- Modify: `src/components/blocks/story-generate/index.tsx`
- Modify: `src/components/blocks/backstory-generate/index.tsx`
- Modify: `src/components/blocks/fanfic-generate/tabbed-fanfic-generate.tsx`
- Modify: `src/components/blocks/dialogue-generate/index.tsx`
- Modify: `src/components/blocks/dnd-backstory-generate/index.tsx`
- Modify: `src/components/blocks/plot-generate/index.tsx`
- Modify: `src/components/blocks/poem-generate/index.tsx`
- Modify: `src/components/blocks/fantasy-generate/index.tsx` when a protected auth action exists
- Test: `tests/auth-generator-source-page-wiring.test.ts`

- [ ] **Step 1: Write failing wiring tests**

Assert each generator passes the matching slug to `requireAuth`:

```text
story-generate -> story-generator
backstory-generate -> backstory-generator
tabbed-fanfic-generate -> fanfic-generator
dialogue-generate -> dialogue-generator
dnd-backstory-generate -> dnd-backstory-generator
plot-generate -> plot-generator
poem-generate -> poem-generator
fantasy-generate -> fantasy-generator, if it has protected actions
```

- [ ] **Step 2: Run the focused test**

Run: `pnpm exec tsx --test tests/auth-generator-source-page-wiring.test.ts`

Expected: FAIL because generator calls currently provide only `source` and `action`.

- [ ] **Step 3: Add stable slugs to auth intents**

Use the existing category/action values and add only:

```ts
requireAuth({
  source: "ai_write",
  action: "continue_writing",
  sourcePage: "story-generator",
});
```

For save flows use `source: "story_save"` and `action: "save_story"` with the same generator-specific slug. Preserve existing continue-AI-write `setSignModalContext` behavior.

- [ ] **Step 4: Run focused tests**

Run: `pnpm exec tsx --test tests/auth-generator-source-page-wiring.test.ts tests/auth-entrypoint-wiring.test.ts tests/auth-success-wiring.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/components/blocks && git add -f tests/auth-generator-source-page-wiring.test.ts && git commit -m "feat: attribute auth conversions to generators"`

## Task 4: Verify the complete attribution flow

**Files:**
- No new production files.

- [ ] **Step 1: Run all attribution-focused tests**

Run: `pnpm exec tsx --test tests/auth-funnel.test.ts tests/auth-context-wiring.test.ts tests/auth-sign-wiring.test.ts tests/auth-entrypoint-wiring.test.ts tests/auth-success-wiring.test.ts tests/auth-source-page.test.ts tests/auth-source-page-wiring.test.ts tests/auth-generator-source-page-wiring.test.ts tests/continue-ai-write-intent.test.ts`

Expected: all attribution and existing auth tests pass.

- [ ] **Step 2: Run source validation**

Run: `pnpm exec tsc --noEmit`

Expected: no errors from changed production files. Existing ignored-test errors, if present, should be reported rather than fixed in this scope.

- [ ] **Step 3: Run lint and build**

Run: `pnpm lint && pnpm build`

Expected: both commands exit 0; existing warnings may remain.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check && rg -n "sourcePage|source_page" src tests/auth-*`

Expected: every generator slug appears in its intended auth entry point, and no sensitive fields are added.

