# Page-Scoped Creative Quota Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Creative's daily free quota to every Creative-enabled landing page with independent page quotas, same-browser anonymous-to-account transfer, and post-quota credit charging.

**Architecture:** Add shared page-aware server quota helpers over the existing Cloudflare KV/REST fallback, then wire each fixed API route to its literal page key after Turnstile and before the AI provider. Add shared page-keyed client state/UI and preserve the six existing activation-tracking changes.

**Tech Stack:** Next.js 15 route handlers, React, TypeScript, Cloudflare KV, `next/headers`, `next-auth`, existing credit services, Turnstile, OpenPanel, and `PaywallModal`.

---

## Files and responsibilities

- Modify `src/lib/free-quota.ts`: page-scoped KV keys, visitor cookie identity, merge markers, and legacy story-key migration.
- Create `src/lib/creative-quota.ts`: route-facing gate and post-provider credit-charge helpers.
- Modify `src/lib/creative-quota-client.ts`: page-keyed localStorage mirror and response classifier.
- Create `src/components/blocks/creative-quota-hint.tsx`: reusable remaining-quota UI.
- Modify `src/lib/auth-funnel.ts` and the 11 mapped API routes/client pages.
- Create `tests/unit/creative-quota.test.ts`; add route tests only if dependency injection is practical.

Page/API mapping:

| Page key | API route | Client |
| --- | --- | --- |
| `story-generator` | `/api/story-generate` | `story-generate/index.tsx` |
| `backstory-generator` | `/api/backstory/generate` | `backstory-generate/index.tsx` |
| `bedtime-story-generator` | `/api/bedtime-story/generate` | `bedtime-story-generate/index.tsx` |
| `comic-generator` | `/api/comic-generate` | `comic-generate/index.tsx` |
| `dialogue-generator` | `/api/dialogue-generate` | `dialogue-generate/index.tsx` |
| `dnd-backstory-generator` | `/api/dnd-backstory/generate` | `dnd-backstory-generate/index.tsx` |
| `fanfic-generator` | `/api/fanfic-generate` | `fanfic-generate/tabbed-fanfic-generate.tsx` |
| `fantasy-generator` | `/api/fantasy-generate` | `fantasy-generate/index.tsx` |
| `plot-generator` | `/api/plot-generate` | `plot-generate/index.tsx` |
| `poem-generator` | `/api/poem-generate` | `poem-generate/index.tsx` |
| `romance-story-generator` | `/api/romance-story/generate` | `romance-story-generate/index.tsx` |

Do not revert or rewrite the six pre-existing activation files. Do not modify unrelated APIs without a Creative model.

### Task 1: Build server quota primitives

**Files:** `src/lib/free-quota.ts`, `src/lib/creative-quota.ts`, `tests/unit/creative-quota.test.ts`

- [ ] Define `CreativePageKey` as the exact 11-key union above and `CreativeQuotaStatus` with `used`, `limit`, `remaining`, and `mode: "free" | "credits"`.
- [ ] Build these exact KV keys: `free-quota:<date>:user:<uuid>:<pageKey>:creative`, `free-quota:<date>:visitor:<visitorId>:<pageKey>:creative`, and `free-quota:<date>:merge:<visitorId>:<uuid>:<pageKey>:creative`. Keep the IP hard-cap key shared across pages.
- [ ] Add a secure `creative_visitor_id` cookie helper using `cookies()`/request headers. Generate a cryptographically random ID if missing; return `Set-Cookie` metadata with `HttpOnly`, `SameSite=Lax`, `Path=/`, bounded `Max-Age`, and `Secure` outside development. Store no account or quota data in the cookie.
- [ ] Implement `checkCreativeQuota(pageKey, identity)`, `incrementCreativeQuota(pageKey, identity)`, and idempotent `mergeVisitorCreativeQuota(pageKey, visitorId, userUuid)`. Merge account and visitor usage with `Math.min(3, accountUsed + visitorUsed)`, write the account value before the marker, and preserve KV/REST fail-open behavior.
- [ ] Migrate the legacy story key `free-quota:<date>:<identity>:creative` once into the new `story-generator` key with a migration marker. Never use the legacy key for other pages or grant duplicate quota.
- [ ] Add focused tests for exact key output, all 11 page keys, capped merges, idempotent markers, anonymous 0/1/2/3 counts, and UTC rollover. Run `pnpm exec tsx tests/unit/creative-quota.test.ts` and expect all cases to pass.

### Task 2: Add the shared API gate

**Files:** `src/lib/creative-quota.ts` and all 11 API routes in the mapping table

- [ ] Expose `prepareCreativeQuota({ pageKey, model })`, returning `skip`, `free`, `credits`, `free_quota_exceeded`, or `insufficient_credits`, current quota, and visitor-cookie metadata. Resolve users through existing `getUserUuid`, merge same-browser anonymous usage before account checks, and check IP hard cap once per request.
- [ ] Expose `commitCreativeQuotaCharge(gate)` using `SG_CREATIVE_COST` or `CreditsAmount.StoryGenerateCreativeCost` and `CreditsTransType.StoryGenerateCreative`. Charge only when mode is `credits` and the provider response succeeds; never charge validation/provider failures.
- [ ] Copy `Set-Cookie` onto quota errors, provider errors, and transformed stream responses without dropping existing content/cache/security headers.
- [ ] In every route, call the gate after Turnstile and before the provider fetch with the route's literal page key. Non-Creative models return `skip`; free mode increments before provider fetch; credit mode charges after successful provider response. Never accept a client page key.
- [ ] Replace only the inline Creative quota block in `story-generate/route.ts`, preserving its current verification, stream, auth, paywall, credit, and error response behavior.

### Task 3: Build shared client quota state and UI

**Files:** `src/lib/creative-quota-client.ts`, `src/components/blocks/creative-quota-hint.tsx`

- [ ] Expose page-aware `getCreativeUsed(pageKey)`, `getCreativeLimit()`, `markCreativeIncrement(pageKey)`, and `markCreativeQuotaExhausted(pageKey)` using `creative_quota:<pageKey>:<UTC-date>`. Copy the old story key to `story-generator` once; localStorage remains an optimistic mirror.
- [ ] Create `CreativeQuotaHint` with `{ pageKey, selectedModel, used, className? }`; render nothing for non-Creative and show remaining/exhausted text for Creative without embedding payment logic.
- [ ] Add a response classifier that reads JSON only on non-OK responses and extracts `free_quota_exceeded` or `insufficient_credits` from route-specific envelopes while tolerating streaming success bodies.

### Task 4: Integrate story and six modified pages

**Files:** `story-generate/index.tsx`, `backstory-generate/index.tsx`, `dialogue-generate/index.tsx`, `dnd-backstory-generate/index.tsx`, `fanfic-generate/tabbed-fanfic-generate.tsx`, `plot-generate/index.tsx`, `poem-generate/index.tsx`

- [ ] Hydrate page-keyed `creativeUsed` state and keep every existing activation start/success/failure event exactly once.
- [ ] Convert story calls to the `story-generator` page key while preserving optimistic auth, logged-in paywall, 429 fallback, 402 fallback, and existing `PaywallModal`.
- [ ] In each existing non-OK branch, handle `429 free_quota_exceeded` by syncing local quota, showing existing copy, and calling `requireAuth({ source: "ai_write", action: "continue_writing", sourcePage: pageKey })`; handle `402 insufficient_credits` by showing existing copy and opening the shared paywall.
- [ ] Call `markCreativeIncrement(pageKey)` only after successful non-empty Creative output. Never increment validation, Turnstile, provider, empty-output, 402, or 429 paths.

### Task 5: Integrate four remaining pages

**Files:** `bedtime-story-generate/index.tsx`, `comic-generate/index.tsx`, `fantasy-generate/index.tsx`, `romance-story-generate/index.tsx`, `src/lib/auth-funnel.ts`

- [ ] Add page state and `CreativeQuotaHint` with exact keys `bedtime-story-generator`, `comic-generator`, `fantasy-generator`, and `romance-story-generator`.
- [ ] Parse each existing non-OK response before its generic toast; route 429 to the page auth intent and 402 to the shared `PaywallModal`; preserve Turnstile, streaming, history, and error behavior.
- [ ] Add missing `bedtime-story-generator`, `comic-generator`, and `romance-story-generator` literals to `AuthSourcePage` if absent; keep all existing values unchanged.

### Task 6: Add regression tests

**Files:** `tests/unit/creative-quota.test.ts` and optionally `tests/unit/creative-quota-routes.test.ts`

- [ ] Cover page isolation, UTC rollover, anonymous 0/1/2/3 usage, same-browser transfer, cross-device/no-cookie behavior, capped sums, and idempotent merge markers.
- [ ] Cover free mode, credit mode, insufficient credits, successful post-provider charge, provider failure without charge, and non-Creative bypass.
- [ ] Run `pnpm exec tsx tests/unit/creative-quota.test.ts` and any added route test file; expect all cases to pass.

### Task 7: Full verification

**Files:** all files changed by Tasks 1-6

- [ ] Run `git diff --check`, `git status --short`, and `git diff --stat`; confirm the six pre-existing activation files remain modified and no unrelated files changed.
- [ ] Run `pnpm lint`; expect exit code 0 with only existing warnings.
- [ ] Run `pnpm build`; expect exit code 0 with all 11 routes/pages compiled.
- [ ] Run `rg -n 'story-generator|backstory-generator|bedtime-story-generator|comic-generator|dialogue-generator|dnd-backstory-generator|fanfic-generator|fantasy-generator|plot-generator|poem-generator|romance-story-generator' src/lib src/app/api src/components/blocks` and confirm every API/client pair uses the matching fixed key, no request page key is trusted, and no existing activation event was removed or duplicated.

