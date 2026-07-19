# OC Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and expose a writing-first `/oc-generator` that generates three concepts, expands one into a structured OC profile, supports locked-field rerolls, stores drafts and versions in browser storage, and hands the profile to existing story generators.

**Architecture:** Add a locale-aware generator page and a focused client workbench. The API returns validated JSON for `concepts`, `profile`, and `reroll` operations, using the existing Turnstile and page-scoped creative quota flow. Browser storage owns drafts and history; session storage carries a versioned profile handoff into Backstory, Story, and D&D without adding database tables or save APIs.

**Tech Stack:** Next.js 15 App Router, React 19 client components, TypeScript, Zod, next-intl, Tailwind CSS, existing shadcn/Radix primitives, `localStorage`, `sessionStorage`, Turnstile, GRSAI-compatible chat completions, OpenPanel, `node:test` through `pnpm exec tsx --test`, and Playwright.

---

## File Structure

### New files

- `src/app/[locale]/(default)/oc-generator/page.tsx`
- `src/app/api/oc-generate/_lib.ts`
- `src/app/api/oc-generate/route.ts`
- `src/components/blocks/oc-generate/index.tsx`
- `src/components/blocks/oc-generate/lib.ts`
- `src/components/blocks/oc-generate/mode-selector.tsx`
- `src/components/blocks/oc-generate/oc-input-form.tsx`
- `src/components/blocks/oc-generate/concept-card.tsx`
- `src/components/blocks/oc-generate/oc-profile.tsx`
- `src/components/blocks/oc-generate/oc-field-row.tsx`
- `src/components/blocks/oc-generate/oc-history-drawer.tsx`
- `src/components/blocks/oc-generate/oc-export-actions.tsx`
- `src/lib/oc-schema.ts`
- `src/lib/oc-storage.ts`
- `src/lib/oc-handoff.ts`
- `src/types/blocks/oc-generate.d.ts`
- `src/i18n/pages/oc-generate/en.json`
- `src/i18n/pages/oc-generate/zh.json`
- `src/i18n/pages/oc-generate/ja.json`
- `src/i18n/pages/oc-generate/ko.json`
- `src/i18n/pages/oc-generate/de.json`
- `src/i18n/pages/oc-generate/ru.json`
- `tests/oc-generate-lib.test.ts`
- `tests/oc-generate-route.test.ts`
- `tests/oc-generate-ui-lib.test.ts`
- `tests/oc-storage.test.ts`
- `tests/oc-handoff.test.ts`
- `tests/oc-generator-page.test.ts`
- `tests/oc-generator-site-registration.test.ts`
- `tests/e2e/oc-generator.spec.ts`

### Modified files

- `src/lib/creative-quota-core.ts`
- `tests/unit/creative-quota.test.ts`
- `src/services/tools.ts`
- `src/components/generator-nav-tabs/index.tsx`
- `src/app/sitemap.ts`
- `src/i18n/messages/en.json`
- `src/i18n/messages/zh.json`
- `src/i18n/messages/ja.json`
- `src/i18n/messages/ko.json`
- `src/i18n/messages/de.json`
- `src/i18n/messages/ru.json`
- `src/components/blocks/backstory-generate/index.tsx`
- `src/components/blocks/dnd-backstory-generate/index.tsx`
- `src/components/blocks/story-generate/index.tsx`

### Responsibilities

- `oc-schema.ts`: Zod schemas and TypeScript types shared by the client, API, storage, and handoff layers.
- API `_lib.ts`: normalization, prompt construction, upstream response extraction, JSON parsing, and field-safe reroll helpers.
- API `route.ts`: request parsing, Turnstile, quota gate, upstream call, response validation, and post-success charging.
- `oc-storage.ts`: versioned localStorage keys, safe parsing, draft persistence, character history limits, deletion, and exports.
- `oc-handoff.ts`: versioned sessionStorage payload and conversion into the existing generator prompt format.
- `oc-generate/lib.ts`: client request builders, field labels, profile-to-Markdown conversion, and UI state helpers.
- block components: the staged workbench, loading/error states, local history, field locks, rerolls, copy/export, and continuation actions.
- page and locale files: metadata, JSON-LD, page copy, presets, FAQs, and localized UI content.
- registry files: make the tool discoverable in the hub, generator tabs, sitemap, and related-tool scoring.

---

### Task 1: Define the OC contract and pure generation helpers

**Files:**
- Create: `src/lib/oc-schema.ts`
- Create: `src/app/api/oc-generate/_lib.ts`
- Create: `tests/oc-generate-lib.test.ts`

- [ ] **Step 1: Write failing tests for normalization, prompts, parsing, and reroll protection**

Add `tests/oc-generate-lib.test.ts` using the repository's `node:test` pattern:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOcPrompt,
  mergeOcReroll,
  normalizeOcRequest,
  parseOcModelResponse,
} from "@/app/api/oc-generate/_lib";

test("normalizes OC input and uses safe defaults", () => {
  const result = normalizeOcRequest({
    mode: "unknown",
    world: "  dark fantasy  ",
    role: "  villain ",
    constraints: "  no chosen one  ",
    locale: "",
  });

  assert.deepEqual(result, {
    mode: "general",
    world: "dark fantasy",
    role: "villain",
    constraints: "no chosen one",
    locale: "en",
  });
});

test("builds JSON-only prompts for all three operations", () => {
  const prompt = buildOcPrompt({
    operation: "concepts",
    input: {
      mode: "rpg",
      world: "icebound frontier",
      role: "reluctant healer",
      constraints: "avoid noble bloodlines",
      locale: "en",
    },
  });

  assert.match(prompt, /JSON only/i);
  assert.match(prompt, /three/i);
  assert.match(prompt, /conflictHook/i);
  assert.match(prompt, /icebound frontier/i);
});

test("parses fenced JSON and validates the profile shape", () => {
  const result = parseOcModelResponse(
    "```json\n{" +
      '"identity":{"name":"Mira","aliases":[],"age":"31",' +
      '"pronouns":"she/her","role":"healer","species":"human"},' +
      '"appearance":"scarred hands","personality":"patient",' +
      '"desire":"keep people alive","flaw":"self-erasure",' +
      '"secret":"she caused the first outbreak","relationships":[],' +
      '"conflict":"a cure requires a sacrifice","storyHooks":[],' +
      '"visualPrompt":"cinematic RPG character portrait"}' +
      "\n```",
    "profile"
  );

  assert.equal(result.identity.name, "Mira");
});

test("reroll changes only unlocked fields", () => {
  const profile = {
    identity: { name: "Mira", aliases: [], age: "31", pronouns: "she/her", role: "healer", species: "human" },
    appearance: "scarred hands",
    personality: "patient",
    desire: "keep people alive",
    flaw: "self-erasure",
    secret: "old secret",
    relationships: [],
    conflict: "old conflict",
    storyHooks: [],
    visualPrompt: "old prompt",
  };

  const merged = mergeOcReroll(profile, { secret: "new secret" }, ["appearance"]);

  assert.equal(merged.secret, "new secret");
  assert.equal(merged.appearance, "scarred hands");
  assert.equal(merged.visualPrompt, "old prompt");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
pnpm exec tsx --test tests/oc-generate-lib.test.ts
```

Expected: FAIL because the OC schema and helper exports do not exist yet.

- [ ] **Step 3: Implement the shared schemas and pure helpers**

Create `src/lib/oc-schema.ts` with these stable exports:

```ts
export const OC_MODES = ["general", "rpg", "anime"] as const;
export const OC_OPERATIONS = ["concepts", "profile", "reroll"] as const;

export type OcMode = (typeof OC_MODES)[number];
export type OcGenerationOperation = (typeof OC_OPERATIONS)[number];

export type OcInput = {
  mode: OcMode;
  world: string;
  role: string;
  constraints: string;
  locale: string;
};

export type OcConcept = {
  id: string;
  name: string;
  premise: string;
  visualHook: string;
  personalityHook: string;
  conflictHook: string;
};

export type OcProfile = {
  identity: {
    name: string;
    aliases: string[];
    age: string;
    pronouns: string;
    role: string;
    species: string;
  };
  appearance: string;
  personality: string;
  desire: string;
  flaw: string;
  secret: string;
  relationships: string[];
  conflict: string;
  storyHooks: string[];
  visualPrompt: string;
};

export const ocInputSchema = z.object({
  mode: z.enum(OC_MODES),
  world: z.string().trim().max(160),
  role: z.string().trim().max(100),
  constraints: z.string().trim().max(1200),
  locale: z.string().trim().min(2).max(10),
});
```

Add Zod schemas for `OcConcept`, `OcProfile`, and the operation-specific request union. The request schema includes `model: z.literal("creative")`; the client never exposes a model picker. Use a bounded top-level `OC_REROLL_FIELDS` tuple (`identity`, `appearance`, `personality`, `desire`, `flaw`, `secret`, `relationships`, `conflict`, `storyHooks`, `visualPrompt`) so the API never accepts arbitrary object paths.

Create `_lib.ts` with these exports:

```ts
export function normalizeOcRequest(input: Partial<OcInput>): OcInput;
export function buildOcPrompt(args: {
  operation: OcGenerationOperation;
  input: OcInput;
  concept?: OcConcept;
  profile?: OcProfile;
  fields?: string[];
  lockedFields?: string[];
}): string;
export function parseOcModelResponse(
  raw: string,
  operation: OcGenerationOperation
): OcConcept[] | OcProfile | Partial<OcProfile>;
export function mergeOcReroll(
  profile: OcProfile,
  changes: Partial<OcProfile>,
  lockedFields: string[]
): OcProfile;
```

The prompt must request JSON only, state the exact output shape, include the locale, include the user constraints, preserve locked fields, and explicitly reject generic filler or copyrighted character copying. `parseOcModelResponse` should accept raw JSON and fenced JSON, then validate against the operation schema.

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
pnpm exec tsx --test tests/oc-generate-lib.test.ts
```

Expected: PASS with four tests.

- [ ] **Step 5: Commit the domain contract**

```bash
git add src/lib/oc-schema.ts src/app/api/oc-generate/_lib.ts tests/oc-generate-lib.test.ts
git commit -m "feat: define oc generator contract"
```

### Task 2: Register the page quota and implement the generation API

**Files:**
- Modify: `src/lib/creative-quota-core.ts`
- Modify: `tests/unit/creative-quota.test.ts`
- Create: `src/app/api/oc-generate/route.ts`
- Create: `tests/oc-generate-route.test.ts`

- [ ] **Step 1: Add the quota key assertion before implementation**

Update the existing quota test from `13` to `14`, assert that `CREATIVE_PAGE_KEYS` contains `"oc-generator"`, and add:

```ts
assert.notEqual(
  buildCreativeQuotaKey("2026-07-19", "user:u1", "oc-generator"),
  buildCreativeQuotaKey("2026-07-19", "user:u1", "story-generator")
);
```

Run:

```bash
pnpm exec tsx --test tests/unit/creative-quota.test.ts
```

Expected: FAIL because the new page key is not in `CREATIVE_PAGE_KEYS`.

- [ ] **Step 2: Add `oc-generator` to the page-key tuple**

Append `"oc-generator"` to `src/lib/creative-quota-core.ts` and keep the exported `CreativePageKey` type derived from that tuple. Do not alter quota limits or KV key formats.

- [ ] **Step 3: Implement the route with success-only charging**

`route.ts` must:

1. Parse the request body and require `turnstileToken`.
2. Validate the operation-specific body through `oc-schema.ts`.
3. Verify Turnstile using the same `TURNSTILE_SECRET_KEY` and Cloudflare endpoint pattern used by existing generator routes.
4. Call `prepareCreativeQuota({ pageKey: "oc-generator", model: "creative", request })`. The public UI has no model selector; the internal `creative` key deliberately activates the existing page-scoped quota and credit flow while the provider model remains fixed.
5. Return `creativeQuotaErrorResponse` immediately when blocked.
6. Call the configured GRSAI-compatible `/v1/chat/completions` endpoint with `gemini-2.5-flash`, `stream: false`, and the prompt from `_lib.ts`.
7. Parse and validate the returned content.
8. Call `commitCreativeQuotaCharge` only after valid content is ready.
9. Attach the visitor cookie with `withCreativeVisitorCookie` on every response that came through the quota gate.

Use these response shapes:

```ts
{ operation: "concepts"; concepts: OcConcept[] }
{ operation: "profile"; profile: OcProfile }
{ operation: "reroll"; changes: Partial<OcProfile> }
```

Return `400` for invalid input, `429`/`402` from the existing quota error helper, and a JSON error response for Turnstile/upstream/schema failures. Never return raw upstream content.

- [ ] **Step 4: Add route contract tests**

Create `tests/oc-generate-route.test.ts` with source-level assertions consistent with this repository's route tests. Assert that the route contains:

```ts
assert.match(source, /pageKey:\s*["']oc-generator["']/);
assert.match(source, /prepareCreativeQuota/);
assert.match(source, /commitCreativeQuotaCharge/);
assert.match(source, /turnstileToken/);
assert.match(source, /parseOcModelResponse/);
assert.doesNotMatch(source, /db\.insert|sg_oc_/);
```

Keep parsing, prompt, and schema behavior covered by `oc-generate-lib.test.ts`; the route test protects wiring without requiring Cloudflare KV or a real model key.

- [ ] **Step 5: Run quota and route tests**

```bash
pnpm exec tsx --test tests/unit/creative-quota.test.ts tests/oc-generate-route.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the API boundary**

```bash
git add src/lib/creative-quota-core.ts tests/unit/creative-quota.test.ts src/app/api/oc-generate/route.ts tests/oc-generate-route.test.ts
git commit -m "feat: add oc generator api quota"
```

### Task 3: Implement browser storage and session handoff

**Files:**
- Create: `src/lib/oc-storage.ts`
- Create: `src/lib/oc-handoff.ts`
- Create: `tests/oc-storage.test.ts`
- Create: `tests/oc-handoff.test.ts`

- [ ] **Step 1: Write storage and handoff tests**

Test these contracts before implementation:

```ts
test("storage keeps newest 20 characters and newest 10 versions", () => {
  const characters = Array.from({ length: 22 }, (_, index) => makeCharacter(index));
  const limited = clampOcCharacters(characters);
  assert.equal(limited.length, 20);

  const versions = Array.from({ length: 12 }, (_, index) => makeVersion(index));
  assert.equal(clampOcVersions(versions).length, 10);
  assert.equal(clampOcVersions(versions)[0].id, "11");
});

test("corrupt storage returns an empty safe value", () => {
  const storage = createMemoryStorage({ "oc-generator:characters:v1": "{" });
  assert.deepEqual(readOcCharacters(storage), []);
});

test("handoff serializes and consumes only the current version", () => {
  const payload = { version: 1, source: "oc-generator" as const, profile: makeProfile(), visualPrompt: "prompt" };
  const storage = createMemoryStorage();
  writeOcHandoff(storage, payload);
  assert.deepEqual(consumeOcHandoff(storage), payload);
  assert.equal(consumeOcHandoff(storage), null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm exec tsx --test tests/oc-storage.test.ts tests/oc-handoff.test.ts
```

Expected: FAIL because the storage and handoff modules do not exist.

- [ ] **Step 3: Implement versioned localStorage operations**

Export these constants and functions from `src/lib/oc-storage.ts`:

```ts
export const OC_DRAFT_KEY = "oc-generator:draft:v1";
export const OC_CHARACTERS_KEY = "oc-generator:characters:v1";

export function readOcDraft(storage?: Storage): OcDraft | null;
export function writeOcDraft(storage: Storage, draft: OcDraft): void;
export function readOcCharacters(storage?: Storage): StoredOcCharacter[];
export function saveOcCharacter(storage: Storage, character: StoredOcCharacter): StoredOcCharacter[];
export function deleteOcCharacter(storage: Storage, id: string): StoredOcCharacter[];
export function clearOcCharacters(storage: Storage): void;
export function clampOcCharacters(characters: StoredOcCharacter[]): StoredOcCharacter[];
export function clampOcVersions(versions: StoredOcVersion[]): StoredOcVersion[];
export function ocProfileToMarkdown(character: StoredOcCharacter, versionId?: string): string;
export function ocProfileToJson(character: StoredOcCharacter, versionId?: string): string;
```

Use `window.localStorage` only at call sites after mount; accept an injected `Storage` in pure functions so tests do not need a browser. Treat malformed JSON, wrong array shapes, and `QuotaExceededError` as recoverable. Save the newest version, deduplicate by character id, sort by `updatedAt`, then enforce the 20/10 limits.

- [ ] **Step 4: Implement the versioned session handoff**

`src/lib/oc-handoff.ts` must export:

```ts
export const OC_HANDOFF_KEY = "oc-generator:handoff:v1";
export function writeOcHandoff(storage: Storage, payload: OcHandoffPayload): void;
export function readOcHandoff(storage: Storage): OcHandoffPayload | null;
export function consumeOcHandoff(storage: Storage): OcHandoffPayload | null;
export function buildOcPromptPrefill(payload: OcHandoffPayload): string;
```

Validate `version`, `source`, and the nested profile before returning a payload. `consumeOcHandoff` must remove the key after a successful read. `buildOcPromptPrefill` should produce a concise plain-text prompt containing identity, appearance, personality, desire, flaw, secret, conflict, story hooks, and visual prompt without putting raw JSON into downstream inputs.

- [ ] **Step 5: Run storage and handoff tests**

```bash
pnpm exec tsx --test tests/oc-storage.test.ts tests/oc-handoff.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit local persistence**

```bash
git add src/lib/oc-storage.ts src/lib/oc-handoff.ts tests/oc-storage.test.ts tests/oc-handoff.test.ts
git commit -m "feat: add local oc storage"
```

### Task 4: Add localized page content and the route shell

**Files:**
- Create: `src/types/blocks/oc-generate.d.ts`
- Create: `src/i18n/pages/oc-generate/en.json`
- Create: `src/i18n/pages/oc-generate/zh.json`
- Create: `src/i18n/pages/oc-generate/ja.json`
- Create: `src/i18n/pages/oc-generate/ko.json`
- Create: `src/i18n/pages/oc-generate/de.json`
- Create: `src/i18n/pages/oc-generate/ru.json`
- Create: `src/app/[locale]/(default)/oc-generator/page.tsx`
- Create: `tests/oc-generator-page.test.ts`

- [ ] **Step 1: Define the page-content type and English copy contract**

Create `src/types/blocks/oc-generate.d.ts` with typed sections for metadata, UI labels, mode labels, role presets, placeholders, output fields, errors, success messages, FAQ, related-tool copy, and CTA. Keep page-content types separate from `OcProfile` domain types.

The English JSON must include at least these keys:

```json
{
  "oc_generate": {
    "metadata": {
      "title": "Original Character Generator for Writers and RPGs",
      "description": "Create a reusable original character profile with personality, conflict, story hooks, and a visual prompt.",
      "keywords": "OC generator, original character generator, OC profile generator, RPG character generator"
    },
    "ui": {
      "title": "Original Character Generator",
      "subtitle": "Build a character you can keep writing with.",
      "breadcrumb_home": "Home",
      "breadcrumb_current": "OC Generator",
      "generate_concepts": "Generate Character Concepts",
      "select_concept": "Choose This Concept",
      "generate_profile": "Build Character Profile",
      "save_local": "Save to This Browser",
      "history": "Saved Characters",
      "export_markdown": "Export Markdown",
      "export_json": "Export JSON",
      "continue_backstory": "Continue to Backstory",
      "continue_story": "Start a Story",
      "continue_dnd": "Build D&D Backstory"
    }
  }
}
```

Translate every key in all six locale files. Do not fall back to English strings inside the client component for visible UI.

- [ ] **Step 2: Write the page source contract test**

Create `tests/oc-generator-page.test.ts` that reads the route source and asserts the route has:

```ts
assert.match(source, /generateMetadata/);
assert.match(source, /buildLanguageAlternates/);
assert.match(source, /oc-generate/);
assert.match(source, /WebApplication/);
assert.match(source, /FAQPage/);
assert.match(source, /RelatedTools/);
```

Also assert that the page imports locale messages from `@/i18n/pages/oc-generate/` and renders a stable generator section id such as `oc-generator`.

- [ ] **Step 3: Implement the locale-aware route shell**

Follow `src/app/[locale]/(default)/backstory-generator/page.tsx`:

- set `revalidate = 60`, `dynamic = "force-static"`, and `dynamicParams = true`;
- load `section` from `@/i18n/pages/oc-generate/${locale}.json`;
- build canonical and language alternate URLs with `buildLanguageAlternates`;
- emit BreadcrumbList and WebApplication JSON-LD;
- emit FAQPage JSON-LD when FAQ items exist;
- render `<OcGenerate section={section} />`;
- render RelatedTools with `currentSlug="oc-generator"` and explicit related slugs for `backstory-generator`, `dnd-backstory-generator`, `fantasy-generator`, `fanfic-generator`, and `story-outline-generator`.

Keep marketing sections limited to content needed for SEO validation; the generator workbench must be the first usable experience.

- [ ] **Step 4: Validate page and translation files**

```bash
pnpm exec tsx --test tests/oc-generator-page.test.ts
```

Expected: PASS. Run `pnpm exec tsc --noEmit` after the page-content type is imported by the route to catch missing locale keys.

- [ ] **Step 5: Commit the route shell**

```bash
git add 'src/app/[locale]/(default)/oc-generator/page.tsx' src/types/blocks/oc-generate.d.ts src/i18n/pages/oc-generate tests/oc-generator-page.test.ts
git commit -m "feat: add oc generator page shell"
```

### Task 5: Build the client workbench and local history UI

**Files:**
- Create: `src/components/blocks/oc-generate/lib.ts`
- Create: `src/components/blocks/oc-generate/index.tsx`
- Create: `src/components/blocks/oc-generate/mode-selector.tsx`
- Create: `src/components/blocks/oc-generate/oc-input-form.tsx`
- Create: `src/components/blocks/oc-generate/concept-card.tsx`
- Create: `src/components/blocks/oc-generate/oc-profile.tsx`
- Create: `src/components/blocks/oc-generate/oc-field-row.tsx`
- Create: `src/components/blocks/oc-generate/oc-history-drawer.tsx`
- Create: `src/components/blocks/oc-generate/oc-export-actions.tsx`
- Create: `tests/oc-generate-ui-lib.test.ts`

- [ ] **Step 1: Write pure client-helper tests**

Add `tests/oc-generate-ui-lib.test.ts` for request construction and display formatting:

```ts
test("builds concept requests with the internal creative quota model", () => {
  assert.deepEqual(buildOcGenerateRequest("concepts", input), {
    operation: "concepts",
    model: "creative",
    ...input,
  });
});

test("builds a reroll request with only unlocked target fields", () => {
  const request = buildOcRerollRequest(profile, ["secret"], ["appearance"]);
  assert.deepEqual(request.fields, ["secret"]);
  assert.deepEqual(request.lockedFields, ["appearance"]);
});

test("profile markdown includes every story-ready section", () => {
  const markdown = ocProfileToMarkdown(makeCharacter());
  assert.match(markdown, /Desire/);
  assert.match(markdown, /Secret/);
  assert.match(markdown, /Story Hooks/);
  assert.match(markdown, /Visual Prompt/);
});
```

- [ ] **Step 2: Implement the client helper functions**

Export these functions from `src/components/blocks/oc-generate/lib.ts`:

```ts
export function buildOcGenerateRequest(operation: "concepts" | "profile", input: OcInput, concept?: OcConcept) {
  return { operation, model: "creative", ...input, ...(concept ? { concept } : {}) };
}

export function buildOcRerollRequest(
  profile: OcProfile,
  fields: string[],
  lockedFields: string[]
) {
  return { operation: "reroll", model: "creative", profile, fields, lockedFields };
}

export function getOcFieldValue(profile: OcProfile, field: string): string | string[];
export function setOcFieldLocked(fields: string[], field: string, locked: boolean): string[];
```

Import `ocProfileToMarkdown` and `ocProfileToJson` from `src/lib/oc-storage.ts` instead of defining duplicate formatters. Keep the API client in the component layer so the route contract remains independently testable. Convert `400`, quota, and upstream errors into typed UI error states rather than rendering server messages as markup.

- [ ] **Step 3: Implement the input and concept components**

`mode-selector.tsx` renders three mutually exclusive mode buttons with `aria-pressed`. `oc-input-form.tsx` renders the world, role, and constraints controls, validates required fields, and calls `onGenerateConcepts`. `concept-card.tsx` renders the five concept fields and calls `onSelect`.

Use existing `Button`, `Textarea`, `Label`, `Tooltip`, and icon patterns. Keep each card's dimensions stable during loading and use `Sparkles`, `RefreshCw`, `Lock`, `Unlock`, `Copy`, `Download`, `BookOpen`, and `Dice5` from `lucide-react` where actions need icons.

- [ ] **Step 4: Implement profile, reroll, export, and history components**

`oc-field-row.tsx` owns one field's value, lock toggle, copy button, and reroll button. `oc-profile.tsx` renders identity and story-ready sections from `OcProfile`; it never mutates the profile directly and instead calls `onReroll(fields)` or `onLockChange(field, locked)`.

`oc-export-actions.tsx` calls `ocProfileToMarkdown` and the storage JSON exporter, creates a Blob, and revokes the object URL after download. `oc-history-drawer.tsx` reads local characters after mount, lists the newest 20 entries, restores a selected version, and supports deletion with confirmation.

- [ ] **Step 5: Implement the workbench state machine**

In `index.tsx`, keep these states explicit:

```ts
type OcView = "idle" | "concepts" | "profile";
type OcBusyAction = "concepts" | "profile" | "reroll" | null;
```

The workbench must:

- restore the draft only after mount;
- autosave meaningful state changes to `OC_DRAFT_KEY`;
- call `/api/oc-generate` for each generation action;
- preserve the selected profile during a reroll failure;
- save a new version locally with a stable character id;
- announce local-only persistence in a toast and visible label;
- scroll to the result on small screens after a successful generation;
- render `CreativeQuotaHint` and `CreativeQuotaPaywall` with `pageKey="oc-generator"`;
- use `TurnstileInvisible` before every API request;
- record the OC analytics events from the design without sending generated text;
- expose continuation actions through the handoff helper.

Use `useReducedMotion` for optional transitions and keep the flow functional when motion is reduced. Do not add a model picker; the request uses `model: "creative"` to activate the existing quota gate.

- [ ] **Step 6: Run UI helper tests and type checking**

```bash
pnpm exec tsx --test tests/oc-generate-ui-lib.test.ts tests/oc-storage.test.ts
pnpm exec tsc --noEmit
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit the client workbench**

```bash
git add src/components/blocks/oc-generate tests/oc-generate-ui-lib.test.ts
git commit -m "feat: build oc generator workbench"
```

### Task 6: Wire the profile handoff into existing generators

**Files:**
- Modify: `src/components/blocks/backstory-generate/index.tsx`
- Modify: `src/components/blocks/dnd-backstory-generate/index.tsx`
- Modify: `src/components/blocks/story-generate/index.tsx`
- Create: `tests/oc-handoff-wiring.test.ts`

- [ ] **Step 1: Add source-contract tests for the three consumers**

Read the three component files and assert each imports and consumes the shared handoff helper:

```ts
for (const file of [backstorySource, dndSource, storySource]) {
  assert.match(file, /consumeOcHandoff/);
  assert.match(file, /buildOcPromptPrefill/);
}
```

Assert that the existing input state setter is used after consuming the payload. Do not assert a specific internal variable name if the current component differs; assert the helper call and a prompt-prefill assignment in each file.

- [ ] **Step 2: Consume handoff after client mount**

In each generator component, add a mount effect that:

1. checks `typeof window !== "undefined"`;
2. calls `consumeOcHandoff(window.sessionStorage)`;
3. returns early for `null`;
4. calls `buildOcPromptPrefill(payload)`;
5. sets the existing prompt/concept state;
6. shows the existing toast mechanism with localized continuation copy;
7. does not auto-submit or spend quota.

The Backstory and D&D tools should prefill their character concept field. The Story generator should prefill its main story prompt. Existing user-entered text wins if it was already non-empty; only an empty prompt is replaced.

- [ ] **Step 3: Run handoff tests and existing generator tests**

```bash
pnpm exec tsx --test tests/oc-handoff.test.ts tests/oc-handoff-wiring.test.ts tests/generator-auth-resume-wiring.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit downstream integration**

```bash
git add src/components/blocks/backstory-generate/index.tsx src/components/blocks/dnd-backstory-generate/index.tsx src/components/blocks/story-generate/index.tsx tests/oc-handoff-wiring.test.ts
git commit -m "feat: connect oc profiles to story generators"
```

### Task 7: Register the tool in navigation, SEO, and locale hubs

**Files:**
- Modify: `src/services/tools.ts`
- Modify: `src/components/generator-nav-tabs/index.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/zh.json`
- Modify: `src/i18n/messages/ja.json`
- Modify: `src/i18n/messages/ko.json`
- Modify: `src/i18n/messages/de.json`
- Modify: `src/i18n/messages/ru.json`
- Create: `tests/oc-generator-site-registration.test.ts`

- [ ] **Step 1: Write registration tests**

Assert that all registration surfaces contain the route and translation key:

```ts
assert.match(toolsSource, /slug:\s*["']oc-generator["']/);
assert.match(toolsSource, /href:\s*["']\/oc-generator["']/);
assert.match(navSource, /href:\s*["']\/oc-generator["']/);
assert.match(sitemapSource, /["']\/oc-generator["']/);
for (const locale of locales) {
  assert.match(readFileSync(`src/i18n/messages/${locale}.json`, "utf8"), /oc_generator/);
}
```

- [ ] **Step 2: Register the tool metadata**

Add to `src/services/tools.ts`:

```ts
{
  slug: "oc-generator",
  nameKey: "ai_tools.tools.oc_generator.name",
  shortDescKey: "ai_tools.tools.oc_generator.desc",
  module: "ai-write",
  category: "character",
  href: "/oc-generator",
  icon: "RiUserStarLine",
  badges: ["new"],
  priority: 98,
}
```

If `RiUserStarLine` is not available in the installed icon set, use the existing `RiUser3Line` icon rather than adding a new icon library.

- [ ] **Step 3: Add navigation, sitemap, and hub translations**

Add `/oc-generator` to `TABS` in `generator-nav-tabs/index.tsx`, to `TOOL_ROUTES` and `routes` in `src/app/sitemap.ts`, and add `ai_tools.tools.oc_generator.name` and `.desc` to every global messages file. Use English copy equivalent to `OC Generator` and `Create original character profiles for stories, RPGs, and roleplay.`; translate the values in the other locales.

- [ ] **Step 4: Run registration tests**

```bash
pnpm exec tsx --test tests/oc-generator-site-registration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit discovery wiring**

```bash
git add src/services/tools.ts src/components/generator-nav-tabs/index.tsx src/app/sitemap.ts src/i18n/messages tests/oc-generator-site-registration.test.ts
git commit -m "feat: register oc generator tool"
```

### Task 8: Add deterministic end-to-end coverage and polish failure states

**Files:**
- Create: `tests/e2e/oc-generator.spec.ts`
- Modify: `src/components/blocks/oc-generate/index.tsx`
- Modify: `src/components/blocks/oc-generate/oc-history-drawer.tsx`
- Modify: `src/components/blocks/oc-generate/oc-export-actions.tsx`

- [ ] **Step 1: Add the Playwright happy-path test**

Mock `/api/oc-generate` in `tests/e2e/oc-generator.spec.ts` and assert the anonymous flow:

```ts
test("creates, refines, saves, and hands off an OC", async ({ page }) => {
  await page.route("**/api/oc-generate", async (route) => {
    const body = route.request().postDataJSON();
    if (body.operation === "concepts") {
      await route.fulfill({ json: { operation: "concepts", concepts: [makeConcept(1), makeConcept(2), makeConcept(3)] } });
      return;
    }
    if (body.operation === "profile") {
      await route.fulfill({ json: { operation: "profile", profile: makeProfile() } });
      return;
    }
    await route.fulfill({ json: { operation: "reroll", changes: { secret: "A new secret" } } });
  });

  const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(`${baseUrl}/oc-generator`);
  await page.getByLabel("World").fill("icebound frontier");
  await page.getByLabel("Character role").fill("reluctant healer");
  await page.getByLabel("Constraints").fill("avoid chosen ones");
  await page.getByRole("button", { name: /generate character concepts/i }).click();
  await page.getByRole("button", { name: /choose this concept/i }).first().click();
  await page.getByRole("button", { name: /build character profile/i }).click();
  await page.getByRole("button", { name: /lock appearance/i }).click();
  await page.getByRole("button", { name: /reroll secret/i }).click();
  await page.getByRole("button", { name: /save to this browser/i }).click();
  await page.getByRole("button", { name: /continue to backstory/i }).click();
  await expect(page).toHaveURL(/backstory-generator/);
});
```

Use the actual localized accessible labels from the English page content. Keep model and Turnstile network calls mocked; this test must not require secrets or Cloudflare.

- [ ] **Step 2: Add quota and storage failure coverage**

Add tests for an API response with `code: "free_quota_exceeded"`, corrupted localStorage, deleting the current character, and export actions. The UI must retain the current profile after a reroll error and show a retry action without losing locked state.

- [ ] **Step 3: Run the E2E test against a local server**

Start the app in one terminal:

```bash
pnpm dev
```

Run in another terminal:

```bash
E2E_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test tests/e2e/oc-generator.spec.ts
```

Expected: PASS on desktop and mobile projects configured by the repository. Do not finish while the dev server process is still needed by the test run.

- [ ] **Step 4: Run lint, typecheck, focused tests, and build**

```bash
pnpm exec tsx --test \
  tests/oc-generate-lib.test.ts \
  tests/oc-generate-route.test.ts \
  tests/oc-storage.test.ts \
  tests/oc-handoff.test.ts \
  tests/oc-generator-page.test.ts \
  tests/oc-generator-site-registration.test.ts \
  tests/unit/creative-quota.test.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Expected: all focused tests pass, lint reports no new errors, TypeScript completes without errors, and the production build includes the localized `/oc-generator` route.

- [ ] **Step 5: Commit the verification coverage**

```bash
git add tests/e2e/oc-generator.spec.ts src/components/blocks/oc-generate
git commit -m "test: verify oc generator flow"
```

## Final Review Checklist

- [ ] `git diff --check` passes.
- [ ] No database schema or migration files were added.
- [ ] No image generation provider or visual community feature was added.
- [ ] Anonymous generation works before login.
- [ ] Browser storage is explicitly labeled local-only.
- [ ] `oc-generator` is registered in quota, tool hub, generator tabs, sitemap, and all locales.
- [ ] Generated profile text is excluded from analytics payloads.
- [ ] Existing Backstory, Story, and D&D generation behavior remains unchanged except for optional prefill.
- [ ] `pnpm lint`, `pnpm exec tsc --noEmit`, focused tests, Playwright, and `pnpm build` pass.
