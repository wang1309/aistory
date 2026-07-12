# Authentication Funnel Instrumentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a typed authentication-intent API and consistent OpenPanel funnel events while preserving existing OAuth and continue-AI-write behavior.

**Architecture:** Keep authentication state in `AppContext`. Add a serializable `AuthIntent` with `source`, `action`, optional redirect, and safe metadata. The sign form emits provider events, while the sign modal emits open/close events. Existing continue-AI-write context remains supported and is mapped into the common intent model without changing provider configuration.

**Tech Stack:** Next.js 15, React 19, TypeScript, NextAuth, next-intl, OpenPanel, Node test runner.

---

## Files and Responsibilities

- Create `src/lib/auth-funnel.ts`: typed source/action definitions, intent normalization, and analytics payload sanitization.
- Modify `src/types/context.d.ts`: expose `AuthIntent`, `requireAuth`, and `clearAuthIntent` through app context.
- Modify `src/contexts/app.tsx`: own the current auth intent and expose the shared auth gate.
- Modify `src/components/sign/form.tsx`: emit provider-click events for every auth context and use normalized intent fields.
- Modify `src/components/sign/modal.tsx`: emit modal-open and modal-close events with source/action.
- Modify `src/components/sign/sign_in.tsx`: provide `header` source and `sign_in` action.
- Modify `src/components/sign/user.tsx`: emit sign-out event only if a stable existing analytics hook is available; otherwise leave sign-out unchanged.
- Modify protected entry points under `src/components/story`, `src/components/blocks`, `src/components/ai-write`, and pricing components: replace direct modal opens with `requireAuth` and explicit source/action.
- Modify `src/components/ai-write/workbench/index.tsx`: keep existing continue-AI-write restoration and add common auth intent fields to its events.
- Create `tests/auth-funnel.test.ts`: test source/action normalization and removal of sensitive fields.
- Modify or create focused wiring tests under `tests/`: assert migrated protected entry points pass explicit auth source/action values.

## Task 1: Add the auth-funnel contract and failing tests

**Files:**
- Create: `src/lib/auth-funnel.ts`
- Test: `tests/auth-funnel.test.ts`

- [ ] **Step 1: Write the failing tests**

Add tests for:

```ts
test("normalizes an auth intent with a safe default action", () => {
  assert.deepEqual(
    normalizeAuthIntent({ source: "header" }),
    { source: "header", action: "sign_in" }
  );
});

test("builds analytics payload without sensitive or arbitrary fields", () => {
  assert.deepEqual(
    buildAuthTrackingPayload({
      source: "story_save",
      action: "save_story",
      provider: "google",
      metadata: { context: "story_generator", email: "private@example.com" },
    }),
    {
      source: "story_save",
      action: "save_story",
      provider: "google",
      context: "story_generator",
    }
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec tsx --test tests/auth-funnel.test.ts`

Expected: FAIL because `src/lib/auth-funnel.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal contract**

Define `AuthSource`, `AuthAction`, `AuthProvider`, `AuthIntent`, `normalizeAuthIntent`, and `buildAuthTrackingPayload`. Only copy the documented fields (`source`, `action`, `provider`, `context`, `locale`, `reason`) into analytics payloads.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm exec tsx --test tests/auth-funnel.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the contract**

Run: `git add src/lib/auth-funnel.ts tests/auth-funnel.test.ts && git commit -m "feat: define auth funnel contract"`

## Task 2: Add `requireAuth` to application context

**Files:**
- Modify: `src/types/context.d.ts`
- Modify: `src/contexts/app.tsx`
- Test: `tests/auth-context-wiring.test.ts`

- [ ] **Step 1: Write the failing wiring test**

Assert that the context type and implementation expose `requireAuth`, preserve a supplied `redirectTo`, and default missing actions to `sign_in`. Use source-text assertions consistent with the repository's existing wiring tests so the test does not require a browser runtime.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec tsx --test tests/auth-context-wiring.test.ts`

Expected: FAIL because the new method and intent state are absent.

- [ ] **Step 3: Implement the shared auth gate**

Add `authIntent` state and:

```ts
const requireAuth = useCallback((intent: AuthIntentInput) => {
  setAuthIntent(normalizeAuthIntent(intent));
  setShowSignModal(true);
}, []);
```

Expose `authIntent`, `requireAuth`, and `clearAuthIntent`. Preserve the existing `signModalContext` API and continue-AI-write cleanup behavior for compatibility.

- [ ] **Step 4: Run the focused test and type-check the changed files**

Run: `pnpm exec tsx --test tests/auth-context-wiring.test.ts`

Then run: `pnpm exec tsc --noEmit`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit the context API**

Run: `git add src/types/context.d.ts src/contexts/app.tsx tests/auth-context-wiring.test.ts && git commit -m "feat: add shared auth intent gate"`

## Task 3: Instrument the auth modal and provider actions

**Files:**
- Modify: `src/components/sign/modal.tsx`
- Modify: `src/components/sign/form.tsx`
- Modify: `src/components/sign/sign_in.tsx`
- Test: `tests/auth-sign-wiring.test.ts`

- [ ] **Step 1: Write failing tests for lifecycle events**

Assert that the sign form tracks `auth_provider_click` for both Google and GitHub regardless of context, and that the modal has `auth_modal_open` and `auth_modal_close` lifecycle tracking with the current source/action.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec tsx --test tests/auth-sign-wiring.test.ts`

Expected: FAIL because only the continue-specific event exists.

- [ ] **Step 3: Implement the minimal event wiring**

Use `useOpenPanel` in the modal and form. Track only safe payloads through `buildAuthTrackingPayload`. Track modal open/close on actual state transitions, avoiding duplicate open events caused by desktop/mobile rendering. Keep the existing `sign_in_start_for_continue` event for backward compatibility.

Update `SignIn` to call:

```ts
requireAuth({ source: "header", action: "sign_in" });
```

- [ ] **Step 4: Run focused tests and lint the changed files**

Run: `pnpm exec tsx --test tests/auth-sign-wiring.test.ts`

Then run: `pnpm lint`

Expected: PASS.

- [ ] **Step 5: Commit the auth UI instrumentation**

Run: `git add src/components/sign tests/auth-sign-wiring.test.ts && git commit -m "feat: instrument auth modal funnel"`

## Task 4: Migrate high-value protected entry points

**Files:**
- Modify: `src/components/story/story-comments.tsx`
- Modify: `src/components/story/story-like-button.tsx`
- Modify: `src/components/story/paywall-modal.tsx`
- Modify: `src/components/blocks/pricing/index.tsx`
- Modify: `src/components/blocks/story-generate/index.tsx`
- Modify: `src/components/blocks/backstory-generate/index.tsx`
- Modify: `src/components/blocks/story-outline-generate/index.tsx`
- Modify: `src/components/ai-write/workbench/index.tsx`
- Test: `tests/auth-entrypoint-wiring.test.ts`

- [ ] **Step 1: Write failing migration tests**

Assert that each protected entry point imports `useAppContext`, destructures `requireAuth`, and passes the expected source/action pair:

```ts
story-comments -> story_comment / comment_story
story-like-button -> story_like / like_story
paywall-modal -> paywall / checkout
pricing -> pricing / checkout
story-generate save/continue -> story_save or ai_write
backstory-generate save/continue -> story_save or ai_write
story-outline-generate expand -> ai_write / continue_writing
AI Write protected actions -> ai_write / continue_writing
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec tsx --test tests/auth-entrypoint-wiring.test.ts`

Expected: FAIL because the entry points still call `setShowSignModal(true)` directly.

- [ ] **Step 3: Migrate calls without changing provider behavior**

Replace direct modal opens with `requireAuth({ source, action, redirectTo })`. Preserve existing `setSignModalContext` calls for continue-AI-write and preserve all existing toast/error behavior. For comment and like flows, record the intended action even if full post-auth replay is not currently possible.

- [ ] **Step 4: Run focused wiring and existing continue tests**

Run: `pnpm exec tsx --test tests/auth-entrypoint-wiring.test.ts tests/continue-ai-write-wiring.test.ts tests/continue-ai-write-intent.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the migrated entry points**

Run: `git add src/components/story src/components/blocks src/components/ai-write tests/auth-entrypoint-wiring.test.ts && git commit -m "feat: add auth intent sources to protected actions"`

## Task 5: Add post-auth success/failure tracking and verify

**Files:**
- Modify: `src/contexts/app.tsx`
- Modify: `src/auth/config.ts` only if the existing callback exposes a safe success signal without changing auth behavior
- Modify: `src/components/ai-write/workbench/index.tsx` if needed for resume events
- Test: `tests/auth-success-wiring.test.ts`

- [ ] **Step 1: Write failing tests**

Assert that the client-side flow records `auth_success` only after an auth attempt, includes the intent source/action, and emits `post_auth_action_resumed` for the existing continue-AI-write restoration path. Assert that failures use a bounded `reason` value and never include sensitive data.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec tsx --test tests/auth-success-wiring.test.ts`

Expected: FAIL because success/resume events are not centralized.

- [ ] **Step 3: Implement safe success tracking**

Use a short-lived client-side pending-auth marker containing only provider, source, action, and timestamp. On the first authenticated session after an attempted provider flow, emit `auth_success`, clear the marker, and let the existing continue-AI-write restoration emit `post_auth_action_resumed`. Do not infer a new user from client data; leave `is_new_user` unset unless the existing server response supplies it safely.

- [ ] **Step 4: Run all focused tests, lint, and build**

Run: `pnpm exec tsx --test tests/auth-funnel.test.ts tests/auth-context-wiring.test.ts tests/auth-sign-wiring.test.ts tests/auth-entrypoint-wiring.test.ts tests/auth-success-wiring.test.ts tests/continue-ai-write-wiring.test.ts tests/continue-ai-write-intent.test.ts`

Then run: `pnpm lint && pnpm build`

Expected: all tests pass, lint passes, and the production build completes successfully.

- [ ] **Step 5: Commit the completed implementation**

Run: `git add src tests && git commit -m "feat: instrument authentication funnel"`

