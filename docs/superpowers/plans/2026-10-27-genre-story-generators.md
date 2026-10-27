# Genre Story Generators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six SEO-ready, independently configurable genre story generators without changing existing public genre URLs.

**Architecture:** Six fixed App Router pages will delegate to one server page builder and one client generator, while a shared typed configuration defines valid genres, UI fields, routes, and creative-quota page keys. A single API route validates its JSON request with a pure `_lib.ts` module, applies the same Turnstile/quota/LLM streaming pipeline used by current generators, and emits a genre-specific prompt.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, next-intl, Tailwind CSS 4, Node `node:test` through `tsx`, existing creative-quota and `fetchChatCompletion` helpers.

---

## File structure

| File | Responsibility |
| --- | --- |
| `src/lib/genre-story-generators.ts` | One typed source for the six slugs, routes, quota keys, icons, and allowed selector values. |
| `src/types/blocks/genre-story-generate.d.ts` | Locale-data contract consumed by the shared client and server page components. |
| `src/app/api/genre-story-generate/_lib.ts` | Pure request parsing, per-genre field validation, and prompt construction. |
| `src/app/api/genre-story-generate/route.ts` | Turnstile, quota, model resolution, shared LLM streaming response. |
| `src/components/blocks/genre-story-generate/index.tsx` | Shared client form, request lifecycle, streamed result, save, and continue-in-editor interactions. |
| `src/components/pages/genre-story-generator-page.tsx` | Shared server page markup, metadata factory, JSON-LD, and content sections. |
| `src/app/[locale]/(default)/{six-slugs}/page.tsx` | Thin fixed URL entry points exporting a per-genre page and metadata factory. |
| `src/i18n/pages/{genre-story-generate}/{locale}.json` | Six per-page locale directories, each carrying only that page's unique content. |
| `src/services/tools.ts`, `src/lib/creative-quota-core.ts`, `src/app/sitemap.ts`, `src/i18n/messages/*.json` | Discovery, quota whitelisting, sitemap, and translated tool cards. |
| `tests/genre-story-generate-*.test.ts` | Pure logic, route wiring, page structure, and site registration coverage. |

### Task 1: Define the genre configuration and test the pure request contract

**Files:**
- Create: `src/lib/genre-story-generators.ts`
- Create: `src/types/blocks/genre-story-generate.d.ts`
- Create: `src/app/api/genre-story-generate/_lib.ts`
- Test: `tests/genre-story-generate-lib.test.ts`

- [ ] **Step 1: Write failing tests for the six supported routes and validation behavior.**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  GENRE_STORY_GENERATOR_SLUGS,
  getGenreStoryGenerator,
} from "@/lib/genre-story-generators";
import {
  buildGenreStoryPrompt,
  parseGenreStoryRequest,
} from "@/app/api/genre-story-generate/_lib";

test("all planned genre generators have fixed route and quota identities", () => {
  assert.deepEqual(GENRE_STORY_GENERATOR_SLUGS, [
    "horror-story-generator",
    "mystery-story-generator",
    "sci-fi-story-generator",
    "adventure-story-generator",
    "children-story-generator",
    "historical-story-generator",
  ]);
  for (const slug of GENRE_STORY_GENERATOR_SLUGS) {
    const generator = getGenreStoryGenerator(slug);
    assert.equal(generator?.href, `/${slug}`);
    assert.equal(generator?.pageKey, slug);
  }
});

test("parser rejects an unknown genre and an empty idea", () => {
  assert.equal(parseGenreStoryRequest({ genre: "fantasy", prompt: "idea", model: "fast" }).ok, false);
  assert.equal(parseGenreStoryRequest({ genre: "horror", prompt: " ", model: "fast" }).ok, false);
});

test("parser keeps only fields allowed by the selected genre", () => {
  const parsed = parseGenreStoryRequest({
    genre: "mystery",
    prompt: "A vanished map",
    model: "standard",
    options: { caseType: "locked_room", clueDensity: "dense", scareIntensity: "intense" },
  });
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value?.options, { caseType: "locked_room", clueDensity: "dense" });
});

test("genre prompts retain each genre's creative contract", () => {
  const mystery = parseGenreStoryRequest({ genre: "mystery", prompt: "A vanished map", model: "standard" });
  const children = parseGenreStoryRequest({ genre: "children", prompt: "A lost kite", model: "standard", options: { ageBand: "6_8", safety: "gentle" } });
  assert.match(buildGenreStoryPrompt(mystery.value!), /clues, misdirection, and final solution/i);
  assert.match(buildGenreStoryPrompt(children.value!), /age-appropriate|safe for children/i);
});
```

- [ ] **Step 2: Run the tests to confirm the module is missing.**

Run: `npx tsx --test tests/genre-story-generate-lib.test.ts`  
Expected: FAIL because `@/lib/genre-story-generators` and `@/app/api/genre-story-generate/_lib` do not exist.

- [ ] **Step 3: Add the configuration, types, parser, and prompt builder.**

Implement a `GenreStoryKind` union of `"horror" | "mystery" | "sci_fi" | "adventure" | "children" | "historical"`, and make each configuration record contain `slug`, `href`, `pageKey`, `icon`, `genre`, `i18nNamespace`, `messageKey`, and the allowed option keys. `getGenreStoryGenerator` must accept a route slug, not a user-supplied genre.

Use this request shape in `_lib.ts`:

```ts
export type GenreStoryRequest = {
  genre?: string;
  prompt?: string;
  model?: string;
  locale?: string;
  outputLanguage?: string;
  length?: string;
  tone?: string;
  perspective?: string;
  audience?: string;
  options?: Record<string, string | undefined>;
};

export function parseGenreStoryRequest(raw: GenreStoryRequest):
  | { ok: true; value: ParsedGenreStoryRequest }
  | { ok: false; error: string };
```

Cap the idea at 2,000 characters. Normalize model to `fast | standard | creative` with `standard` as the fallback, normalize missing common selectors to `medium`, `balanced`, `third_person`, and `general`, and keep only options listed for the parsed genre. Use these exact per-genre contracts in `buildGenreStoryPrompt`:

```ts
const GENRE_REQUIREMENTS: Record<GenreStoryKind, string> = {
  horror: "Build dread through the selected horror mode and intensity; honour the requested ending without gratuitous gore.",
  mystery: "Plant fair clues, distinguish red herrings from evidence, and make the final solution logically follow from the clues.",
  sci_fi: "Apply the selected science-fiction mode and world rules consistently; show the human consequences of the technology.",
  adventure: "Give the protagonist a concrete mission, escalating obstacles, travel or discovery, an opposing force, and an earned resolution.",
  children: "Keep the language, conflict, and emotional stakes age-appropriate; follow the safety boundary and make the educational goal natural rather than preachy.",
  historical: "Respect the stated era and place, separate documented historical context from invented characters and plot, and never present invented details as fact.",
};
```

The prompt must include the genre contract, common selectors, nonempty option values, output language, and the user's idea inside a clearly labelled `Story idea` section. It must instruct the model not to reveal private chain-of-thought.

- [ ] **Step 4: Re-run the pure tests.**

Run: `npx tsx --test tests/genre-story-generate-lib.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit the pure domain layer.**

```bash
git add src/lib/genre-story-generators.ts src/types/blocks/genre-story-generate.d.ts src/app/api/genre-story-generate/_lib.ts tests/genre-story-generate-lib.test.ts
git commit -m "feat: add genre story request contracts"
```

### Task 2: Add the streaming generator API and creative quota keys

**Files:**
- Create: `src/app/api/genre-story-generate/route.ts`
- Modify: `src/lib/creative-quota-core.ts`
- Test: `tests/genre-story-generate-route.test.ts`

- [ ] **Step 1: Write the failing route-wiring test.**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/app/api/genre-story-generate/route.ts", "utf8");
const quota = readFileSync("src/lib/creative-quota-core.ts", "utf8");

test("genre story route uses the shared validator, optional Turnstile, quota, and LLM client", () => {
  assert.match(route, /parseGenreStoryRequest/);
  assert.match(route, /if \(!secretKey\) return true/);
  assert.match(route, /prepareCreativeQuota\(\{/);
  assert.match(route, /pageKey: generator\.pageKey/);
  assert.match(route, /commitCreativeQuotaCharge/);
  assert.match(route, /withCreativeVisitorCookie/);
  assert.match(route, /fetchChatCompletion/);
  assert.doesNotMatch(route, /https:\/\/api\.grsai\.com/);
});

test("all six page keys can be queried by the quota status endpoint", () => {
  for (const pageKey of [
    "horror-story-generator", "mystery-story-generator", "sci-fi-story-generator",
    "adventure-story-generator", "children-story-generator", "historical-story-generator",
  ]) assert.match(quota, new RegExp(`"${pageKey}"`));
});
```

- [ ] **Step 2: Run the route test to confirm it fails.**

Run: `npx tsx --test tests/genre-story-generate-route.test.ts`  
Expected: FAIL because the route is absent and the six quota keys are absent.

- [ ] **Step 3: Implement the API route.**

Add the six page keys to `CREATIVE_PAGE_KEYS`. In `POST`, parse the JSON through `parseGenreStoryRequest`; reject parser errors with `respErr`. Resolve the configuration from the parsed genre, then apply this guard before calling the provider:

```ts
const secretKey = process.env.TURNSTILE_SECRET_KEY;
if (secretKey) {
  if (!requestData.turnstileToken) return respErr("Verification required");
  if (!(await verifyTurnstileToken(requestData.turnstileToken))) {
    return respErr("Verification failed");
  }
}

const quotaGate = await prepareCreativeQuota({
  pageKey: generator.pageKey,
  model: input.model,
  request: req,
});
const quotaError = creativeQuotaErrorResponse(quotaGate);
if (quotaError) return quotaError;
```

Resolve the model only with `resolveModelTier`; invoke `fetchChatCompletion` with `stream: true`; filter `<think>` content; transform SSE deltas into existing `0:"..."\n` chunks; call `commitCreativeQuotaCharge` only after a usable provider response body exists; and wrap every return after quota preparation with `withCreativeVisitorCookie`.

- [ ] **Step 4: Re-run API and pure tests.**

Run: `npx tsx --test tests/genre-story-generate-lib.test.ts tests/genre-story-generate-route.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit the API boundary.**

```bash
git add src/app/api/genre-story-generate/route.ts src/lib/creative-quota-core.ts tests/genre-story-generate-route.test.ts
git commit -m "feat: add genre story generation API"
```

### Task 3: Build the shared client and server page composition

**Files:**
- Create: `src/components/blocks/genre-story-generate/index.tsx`
- Create: `src/components/pages/genre-story-generator-page.tsx`
- Create: `src/app/[locale]/(default)/horror-story-generator/page.tsx`
- Create: `src/app/[locale]/(default)/mystery-story-generator/page.tsx`
- Create: `src/app/[locale]/(default)/sci-fi-story-generator/page.tsx`
- Create: `src/app/[locale]/(default)/adventure-story-generator/page.tsx`
- Create: `src/app/[locale]/(default)/children-story-generator/page.tsx`
- Create: `src/app/[locale]/(default)/historical-story-generator/page.tsx`
- Test: `tests/genre-story-generate-page.test.ts`

- [ ] **Step 1: Write the failing page structure test.**

```ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const slugs = [
  "horror-story-generator", "mystery-story-generator", "sci-fi-story-generator",
  "adventure-story-generator", "children-story-generator", "historical-story-generator",
];

test("every genre has a fixed page entry point", () => {
  for (const slug of slugs) {
    const path = `src/app/[locale]/(default)/${slug}/page.tsx`;
    assert.ok(existsSync(path), `${slug} page is missing`);
    const source = readFileSync(path, "utf8");
    assert.match(source, /createGenreStoryGeneratorMetadata/);
    assert.match(source, /createGenreStoryGeneratorPage/);
  }
});

test("shared page component emits canonical alternates and all required schema", () => {
  const source = readFileSync("src/components/pages/genre-story-generator-page.tsx", "utf8");
  assert.match(source, /buildLanguageAlternates/);
  assert.match(source, /BreadcrumbList/);
  assert.match(source, /WebApplication/);
  assert.match(source, /FAQPage/);
  assert.match(source, /RelatedTools/);
});

test("shared client uses per-page quota, Turnstile, stream endpoint, save, and continue hand-off", () => {
  const source = readFileSync("src/components/blocks/genre-story-generate/index.tsx", "utf8");
  assert.match(source, /useCreativeQuotaPage\(generator\.pageKey\)/);
  assert.match(source, /TurnstileInvisible/);
  assert.match(source, /\/api\/genre-story-generate/);
  assert.match(source, /StorySaveDialog/);
  assert.match(source, /buildContinueIntentPayload/);
});
```

- [ ] **Step 2: Run the page structure test to confirm it fails.**

Run: `npx tsx --test tests/genre-story-generate-page.test.ts`  
Expected: FAIL because the shared components and fixed page files do not exist.

- [ ] **Step 3: Implement the shared client generator.**

The component accepts `{ generator, section }`, calls `useCreativeQuotaPage(generator.pageKey)`, and never uses raw unvalidated field names from the locale bundle as API keys. Store selector values in `Record<string, string>` keyed by `generator.optionKeys`. Submit this payload after Turnstile succeeds:

```ts
body: JSON.stringify({
  genre: generator.genre,
  prompt: prompt.trim(),
  model: selectedModel,
  locale,
  outputLanguage: selectedLanguage,
  length,
  tone,
  perspective,
  audience,
  options,
  turnstileToken,
}),
```

Render every item in `section.genre_fields` only when its `key` is in `generator.optionKeys`; therefore a locale typo cannot surface an API-only field. Parse returned `0:` chunks using a buffered decoder, increment the matching quota only after nonempty output, and retain `CompletionGuide`, `StorySaveDialog`, `StoryStorage`, `buildContinueIntentPayload`, and `writePendingAuthResume`. Put all visible messages in `section` instead of locale ternaries.

- [ ] **Step 4: Implement the shared server page and six wrappers.**

`createGenreStoryGeneratorMetadata(slug)` must dynamically import `@/i18n/pages/${generator.i18nNamespace}/${locale}.json`, select `messages.default[generator.messageKey]`, and return a locale-aware canonical URL plus `buildLanguageAlternates(generator.href)`. `createGenreStoryGeneratorPage(slug)` must call `setRequestLocale`, render the three JSON-LD objects, then render this section sequence:

```tsx
<GenreStoryGenerate generator={generator} section={section} />
<FeatureIntro section={section.feature_intro} accent="orange" />
<HowToUse section={section.how_to_use} accent="orange" />
<Benefits section={section.feature_benefits} accent="orange" />
<UseCases section={section.feature_section} accent="orange" />
<FAQ section={section.faq_section} accent="orange" />
<RelatedTools
  currentSlug={generator.slug}
  limit={6}
  title={t("ai_tools.related_title")}
  description={t("ai_tools.section_description_hub")}
  moreHref="/ai-write-tool"
  moreLabel={t("ai_tools.related_more_label")}
  accent="orange"
/>
<CTA section={section.cta_section} accent="orange" />
```

Each route wrapper must use a literal slug, for example:

```ts
import {
  createGenreStoryGeneratorMetadata,
  createGenreStoryGeneratorPage,
} from "@/components/pages/genre-story-generator-page";

export const revalidate = 60;
export const dynamic = "force-static";
export const generateMetadata = createGenreStoryGeneratorMetadata("horror-story-generator");
export default createGenreStoryGeneratorPage("horror-story-generator");
```

- [ ] **Step 5: Re-run component and page tests.**

Run: `npx tsx --test tests/genre-story-generate-page.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit shared presentation code.**

```bash
git add src/components/blocks/genre-story-generate/index.tsx src/components/pages/genre-story-generator-page.tsx 'src/app/[locale]/(default)/horror-story-generator/page.tsx' 'src/app/[locale]/(default)/mystery-story-generator/page.tsx' 'src/app/[locale]/(default)/sci-fi-story-generator/page.tsx' 'src/app/[locale]/(default)/adventure-story-generator/page.tsx' 'src/app/[locale]/(default)/children-story-generator/page.tsx' 'src/app/[locale]/(default)/historical-story-generator/page.tsx' tests/genre-story-generate-page.test.ts
git commit -m "feat: add shared genre story pages"
```

### Task 4: Add unique six-language page content and tool-card translations

**Files:**
- Create: `src/i18n/pages/horror-story-generate/{en,zh,de,ko,ja,ru}.json`
- Create: `src/i18n/pages/mystery-story-generate/{en,zh,de,ko,ja,ru}.json`
- Create: `src/i18n/pages/sci-fi-story-generate/{en,zh,de,ko,ja,ru}.json`
- Create: `src/i18n/pages/adventure-story-generate/{en,zh,de,ko,ja,ru}.json`
- Create: `src/i18n/pages/children-story-generate/{en,zh,de,ko,ja,ru}.json`
- Create: `src/i18n/pages/historical-story-generate/{en,zh,de,ko,ja,ru}.json`
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/zh.json`
- Modify: `src/i18n/messages/de.json`
- Modify: `src/i18n/messages/ko.json`
- Modify: `src/i18n/messages/ja.json`
- Modify: `src/i18n/messages/ru.json`
- Test: `tests/genre-story-generate-content.test.ts`

- [ ] **Step 1: Write failing locale-data validation.**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const locales = ["en", "zh", "de", "ko", "ja", "ru"];
const genres = ["horror", "mystery", "sci_fi", "adventure", "children", "historical"];

test("all locales ship complete, unique genre page content", () => {
  for (const locale of locales) {
    for (const [genre, namespace] of Object.entries({
      horror: "horror-story-generate",
      mystery: "mystery-story-generate",
      sci_fi: "sci-fi-story-generate",
      adventure: "adventure-story-generate",
      children: "children-story-generate",
      historical: "historical-story-generate",
    })) {
      const page = JSON.parse(readFileSync(`src/i18n/pages/${namespace}/${locale}.json`, "utf8"));
      const section = page[`${genre}_story_generate`];
      assert.ok(section?.metadata?.title, `${locale}/${genre} missing title`);
      assert.ok(section?.metadata?.description, `${locale}/${genre} missing description`);
      assert.ok(section?.genre_fields?.length >= 3, `${locale}/${genre} needs genre inputs`);
      assert.ok(section?.faq_section?.items?.length >= 4, `${locale}/${genre} needs FAQ content`);
    }
  }
});

test("tool cards exist in every shared message bundle", () => {
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(`src/i18n/messages/${locale}.json`, "utf8"));
    for (const key of ["horror_story_generator", "mystery_story_generator", "sci_fi_story_generator", "adventure_story_generator", "children_story_generator", "historical_story_generator"]) {
      assert.ok(messages.ai_tools?.tools?.[key]?.name, `${locale}/${key} missing name`);
      assert.ok(messages.ai_tools?.tools?.[key]?.desc, `${locale}/${key} missing desc`);
    }
  }
});
```

- [ ] **Step 2: Run the content test to confirm it fails.**

Run: `npx tsx --test tests/genre-story-generate-content.test.ts`  
Expected: FAIL because the locale directory and tool-card keys do not exist.

- [ ] **Step 3: Author the locale bundles.**

Every page directory must contain all six locale files, each with one genre-specific root key: `horror_story_generate`, `mystery_story_generate`, `sci_fi_story_generate`, `adventure_story_generate`, `children_story_generate`, or `historical_story_generate`. Each root object must supply `metadata`, `ui`, `placeholders`, `ai_models`, `common_fields`, `genre_fields`, `random_prompts`, `validation`, `success`, `errors`, `output`, `completion_guide`, `feature_intro`, `how_to_use`, `feature_benefits`, `feature_section`, `faq_section`, and `cta_section`.

Use the approved exact input keys: `horrorMode`, `scareIntensity`, `endingType`; `caseType`, `clueDensity`, `detectiveViewpoint`, `revealStyle`; `technologyTheme`, `era`, `scienceMode`, `worldRule`; `mission`, `location`, `opponent`, `riskLevel`; `ageBand`, `learningGoal`, `vocabularyLevel`, `safety`; `timePeriod`, `location`, `historicalContext`, `fictionRatio`. Page prose and FAQs must explain the corresponding fields; do not use a find-and-replace title template.

Add translated `name` and `desc` entries under `ai_tools.tools` for all six snake-case tool keys in every global messages file.

- [ ] **Step 4: Re-run locale tests.**

Run: `npx tsx --test tests/genre-story-generate-content.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit locale content.**

```bash
git add src/i18n/pages/horror-story-generate src/i18n/pages/mystery-story-generate src/i18n/pages/sci-fi-story-generate src/i18n/pages/adventure-story-generate src/i18n/pages/children-story-generate src/i18n/pages/historical-story-generate src/i18n/messages/en.json src/i18n/messages/zh.json src/i18n/messages/de.json src/i18n/messages/ko.json src/i18n/messages/ja.json src/i18n/messages/ru.json tests/genre-story-generate-content.test.ts
git commit -m "feat: add genre story generator content"
```

### Task 5: Register all six tools and verify sitemap coverage

**Files:**
- Modify: `src/services/tools.ts`
- Modify: `src/app/sitemap.ts`
- Test: `tests/genre-story-generate-site-registration.test.ts`

- [ ] **Step 1: Write the failing registration test.**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import sitemap from "@/app/sitemap";
import { locales } from "@/i18n/locale";
import { tools } from "@/services/tools";

const slugs = [
  "horror-story-generator", "mystery-story-generator", "sci-fi-story-generator",
  "adventure-story-generator", "children-story-generator", "historical-story-generator",
];

test("all genre generators are discoverable story tools", () => {
  for (const slug of slugs) {
    const tool = tools.find((entry) => entry.slug === slug);
    assert.equal(tool?.href, `/${slug}`);
    assert.equal(tool?.module, "ai-write");
    assert.equal(tool?.category, "story");
  }
});

test("every fixed genre URL is present for every locale", async () => {
  const urls = (await sitemap()).map((entry) => entry.url);
  for (const locale of locales) for (const slug of slugs) {
    const expected = locale === "en"
      ? `https://storiesgenerator.org/${slug}`
      : `https://storiesgenerator.org/${locale}/${slug}`;
    assert.ok(urls.includes(expected), `missing ${expected}`);
  }
});

test("the two hardcoded sitemap route lists remain synchronized", () => {
  const source = readFileSync("src/app/sitemap.ts", "utf8");
  for (const slug of slugs) {
    assert.equal((source.match(new RegExp(`['"]/${slug}['"]`, "g")) ?? []).length, 2, slug);
  }
});
```

- [ ] **Step 2: Run the registration test to confirm it fails.**

Run: `npx tsx --test tests/genre-story-generate-site-registration.test.ts`  
Expected: FAIL because none of the six tools or sitemap routes is registered.

- [ ] **Step 3: Register each tool and both sitemap entries.**

Add six `Tool` objects with `module: "ai-write"`, `category: "story"`, `href` equal to the fixed root URL, `nameKey` and `shortDescKey` matching Task 4, and already-exported icons: `RiMoonLine`, `RiSearchLine`, `RiRocketLine`, `RiRouteLine`, `RiBookOpenLine`, and `RiHistoryLine`. Use priorities below the existing story generators, ordered Horror 84, Mystery 83, Sci-Fi 82, Adventure 81, Children 80, Historical 79.

Insert every fixed route once in `TOOL_ROUTES` and once in the static `routes` array. Do not add aliases, redirects, old URL modifications, or generated story URLs to the sitemap.

- [ ] **Step 4: Run all new targeted tests.**

Run: `npx tsx --test tests/genre-story-generate-lib.test.ts tests/genre-story-generate-route.test.ts tests/genre-story-generate-page.test.ts tests/genre-story-generate-content.test.ts tests/genre-story-generate-site-registration.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit registrations.**

```bash
git add src/services/tools.ts src/app/sitemap.ts tests/genre-story-generate-site-registration.test.ts
git commit -m "feat: register genre story generators"
```

### Task 6: Perform production-level verification

**Files:**
- Modify only if verification exposes a defect in the files above.

- [ ] **Step 1: Check formatting and type/build compatibility.**

Run: `pnpm lint`  
Expected: exit code 0.

- [ ] **Step 2: Build the production application.**

Run: `pnpm build`  
Expected: exit code 0 and successful static generation for all six locale-aware routes.

- [ ] **Step 3: Inspect the final change set.**

Run: `git diff --check && git status --short`  
Expected: no whitespace errors and no uncommitted implementation files.

- [ ] **Step 4: Commit only required verification corrections.**

If a verification command identifies a defect, fix it with a new test when appropriate, then stage the specific changed source and test files and commit with `git commit -m "fix: verify genre story generators"`. Do not create a commit when verification did not require a correction.

## Self-review

- Spec coverage: Tasks 1–2 implement six typed, genre-specific generation contracts; Task 3 supplies six fixed canonical pages, shared UX, JSON-LD, alternates, saving, and continuation; Task 4 provides all six locales and unique SEO content; Task 5 registers cards, quota keys, and both Sitemap lists; Task 6 runs targeted tests, lint, and build.
- Scope: Old genre URLs, `/story-generate`, community pages, redirects, and the second-phase tool cluster are explicitly untouched.
- Type consistency: Route slug, `pageKey`, `GenreStoryKind`, locale `genre_fields.key`, i18n namespace/root key, and API `options` are connected through `src/lib/genre-story-generators.ts`; fixed page wrappers pass slugs while API requests pass kind values.
- No placeholders: all planned routes, field keys, quota identities, prompt contracts, test files, and commands are named above.
