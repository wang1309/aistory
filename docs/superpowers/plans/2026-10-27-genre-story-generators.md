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
| `src/app/api/genre-story-title-generate/{_lib.ts,route.ts}` | Reusable, genre-aware five-title mini-generator and its isolated, testable streaming API boundary. |
| `src/components/blocks/genre-story-generate/index.tsx` | Shared client form, request lifecycle, streamed result, save, and continue-in-editor interactions. |
| `src/components/blocks/genre-story-title-generator/index.tsx` | Reusable title input, Turnstile lifecycle, request state, and five-result renderer for supported genre pages. |
| `src/components/blocks/horror-story-seo-content/index.tsx` | Horror-only examples, idea/plot and prompt sections, five-title mini-generator, two-sentence examples, video-adaptation hand-off, and controlled internal links. |
| `src/components/pages/genre-story-generator-page.tsx` | Shared server page markup, metadata factory, JSON-LD, and content sections. |
| `src/app/[locale]/(default)/{six-slugs}/page.tsx` | Thin fixed URL entry points exporting a per-genre page and metadata factory. |
| `src/i18n/pages/{genre-story-generate}/{locale}.json` | Six per-page locale directories, each carrying only that page's unique content. |
| `src/services/tools.ts`, `src/lib/creative-quota-core.ts`, `src/app/sitemap.ts`, `src/i18n/messages/*.json` | Discovery, quota whitelisting, sitemap, and translated tool cards. |
| `tests/genre-story-generate-*.test.ts` | Pure logic, route wiring, page structure, and site registration coverage. |
| `tests/horror-story-generator-seo.test.ts`, `tests/genre-story-title-generate-*.test.ts` | Genre-page SEO contracts, visible keyword-layout sections, internal-link rules, and exactly-five-title behavior. |

## Approved Horror landing-page SEO brief

**Evidence boundary:** Keyword variants, volumes, SERP observations, and competitor observations in this section are supplied strategy inputs. They have not been independently validated from Search Console or a live SERP in this repository. Before release, record the primary query baseline and validate the live SERP/query mix; after release, monitor impressions, clicks, CTR, query mix, generation starts, and completion rate rather than promising ranking outcomes.

**Searcher task:** For people searching for an AI horror or scary-story generator, the page helps them turn a premise into a story, plot, prompt, short scare, or title through an immediately usable form and examples.

**Canonical decision:** Keep the confirmed single URL, `/horror-story-generator`. Do not create `/ai-horror-story-generator`; `AI` is covered in visible metadata and copy without creating a competing canonical.

| Element | Required English copy / behavior |
| --- | --- |
| Title | `Free Horror Story Generator – AI Scary Story Maker` |
| Meta description | `Generate creepy plots, cursed characters and two-sentence scares in seconds. Free AI horror story generator — horror story ideas, titles and prompts, no sign-up.` |
| H1 | `Free AI Horror Story Generator` |
| First sentence | `Turn one line of an idea into a full horror story, a plot outline or a two-sentence scare — pick a subgenre and generate.` |
| Meta keywords | Do not add a `keywords` metadata tag. |
| Trust line | Use a truthful line such as `Free • No sign-up required • Start instantly`. Do not use `Unlimited` while standard/creative model usage is quota-limited. |

The hero must contain the working generator, not a button leading elsewhere. Its Horror options are exactly: **subgenre** `horror`, `spooky`, `psychological`, `supernatural`; **length** `two_sentence`, `short`, `full`; plus intensity and ending. Display three editorial cards immediately after the form as clearly labelled example outputs, not as claims about a user's live generation.

The visible English H2/H3 structure is:

1. `Horror Story Ideas & Plots`
   - `Horror story ideas with a twist`
   - `Plot structures that actually scare`
2. `Horror Story Prompts by Subgenre`, with Psychological, Supernatural, Body Horror, Folk Horror, Creepypasta, and Analog Horror subtopics.
3. `Horror Story Titles`, with an in-page premise input that returns exactly five titles.
4. `Two-Sentence Horror Stories`, with 12 original examples.
5. `How to Generate a Horror Story with AI`, with four concrete steps.
6. `Who Uses a Horror Story Generator`, covering novelists, storytellers, TikTok/YouTube creators, and hobbyists.
7. `From Horror Story to Video`, which exposes scene beats, narration, and visual cues suitable for exporting to a video workflow. The site currently has no video-rendering tool, so the copy must say it helps prepare an adaptation and must not claim to generate a video.
8. `What is a Horror Story Generator?`
9. `Frequently Asked Questions`

The FAQ must visibly include these six questions and use the same text in JSON-LD only when each answer is visible: `How can I create my own scary story?`, `Can you make me a horror story?`, `Can ChatGPT write horror stories?`, `What is the scariest story ever?`, `What is the best free horror story generator?`, and `Can I make a horror story video from the generated story?`.

Internal-link rules:

- Link the exact anchor `AI story generator` to `/`.
- Link to existing supporting tools only: `/plot-generator`, `/story-prompt-generator`, `/book-title-generator`, and `/ai-write`.
- Do not create routes or dead links for scary, spooky, ghost, Halloween, creepypasta, analog-horror, or Christmas-horror variants. Mention them only as readable subtopics until a distinct product experience justifies a page.
- A future indexable `horror writing prompts` article should link back here using natural `horror story generator` anchor text; creating that article is outside this six-generator implementation.

## Approved Mystery landing-page SEO brief

**Evidence boundary:** The supplied keyword groupings, volumes, SERP observations, and competitor engagement observations are strategy inputs, not verified Search Console or live-SERP facts in this repository. Record a baseline and validate query mix, CTR, generation starts, and completion rate after release; no ranking or dwell-time result is guaranteed.

**Searcher task:** For writers, teachers, tabletop GMs, and short-form creators searching for an AI mystery-story or plot generator, the page turns a setting, victim, and suspect list into a clue-driven plot, a short story, or a two-line hook.

**Canonical decision:** Keep `/mystery-story-generator` as the main tool page; never use `/mystery-story-generate`. The approved English TDH is:

| Element | Required English copy / behavior |
| --- | --- |
| Title | `Free Mystery Story Generator – AI Mystery Plot Maker` |
| Meta description | `Generate a mystery plot, clue trail and twist ending in seconds. Free AI mystery story generator — mystery story ideas, titles and prompts, no sign-up.` |
| H1 | `Free AI Mystery Story Generator` |
| First sentence | `Give it a setting, a victim and a suspect list — get a full mystery plot, a short story or a two-line hook you can build on.` |
| Meta keywords | Do not add a `keywords` metadata tag. |
| Trust line | Use `Free • No sign-up required • Start instantly`; do not claim `Unlimited` while standard/creative usage has quotas. |

The Mystery hero contains the usable form and three labelled editorial example cards: a locked-room clue list, a noir opening, and a three-suspect wheel. Its first-viewport fields are subgenre `murder`, `cozy`, `locked_room`, `detective`, `noir`, `psychological`; length `hook`, `short`, `full_outline`; intensity; and a twist toggle.

The visible English H2/H3 structure is:

1. `Mystery Story Ideas & Plot Outlines`, including `Mystery story ideas with a twist`.
2. `Mystery Story Prompts by Subgenre`, covering Murder, Cozy, Locked-room, Detective, Noir, and Psychological.
3. `Murder Mystery Generator`, kept short on the main page as a content section and supported by the existing Murder subgenre control; it does not create a separate route.
4. `Mystery Story Titles`, using the shared premise-to-five-titles tool.
5. `How to Build a Mystery Plot Step by Step`, covering crime, clues, suspects, and reveal.
6. `Clues, Red Herrings and the Twist`.
7. `Mystery vs Thriller: Which Generator Do You Need?`.
8. `Who Uses a Mystery Story Generator`, covering novelists, D&D/tabletop GMs, teachers, and short-form video creators.
9. `What is a Mystery Story Generator?` and `Frequently Asked Questions`.

Visible FAQs and their JSON-LD counterparts must be identical: `Is there a free mystery story generator?`, `Can AI write a good mystery story?`, `How do I come up with a mystery plot?`, `Can I generate a fantasy mystery story?`, `Can I generate a romance mystery story?`, `What's the difference between a mystery and a thriller?`, and `Can I generate a crime story instead?`.

Internal-link rules:

- Link `AI story generator` to `/` and `horror story generator` to `/horror-story-generator`.
- Keep `Murder Mystery Generator` as readable main-page content, not an internal link or a separate route in this scope.
- Link `mystery story ideas` only after the information article is published. Current production architecture uses `/posts/[slug]`, so its canonical must be `/posts/mystery-story-ideas`, not `/blog/mystery-story-ideas`. Moving to `/blog` requires an approved site-wide migration and permanent redirects for all existing `/posts` URLs.
- Do not create thriller or crime tool pages for this brief alone. Link to those routes only if a separate tool with an independent user task exists.

The information article is separately editorial work and must be published through the existing posts system before it can receive an internal link.

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
  getGenreStoryGeneratorByGenre,
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
  assert.equal(getGenreStoryGeneratorByGenre("mystery")?.slug, "mystery-story-generator");
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
    options: { subgenre: "locked_room", mysteryIntensity: "high", includeTwist: "yes", scareIntensity: "intense" },
  });
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value?.options, { subgenre: "locked_room", mysteryIntensity: "high", includeTwist: "yes" });
});

test("horror preserves the approved hero options", () => {
  const parsed = parseGenreStoryRequest({
    genre: "horror",
    prompt: "A radio repeats tomorrow's deaths.",
    length: "two_sentence",
    options: { horrorMode: "psychological", scareIntensity: "high", endingType: "twist" },
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value?.length, "two_sentence");
  assert.deepEqual(parsed.value?.options, {
    horrorMode: "psychological", scareIntensity: "high", endingType: "twist",
  });
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

Implement a `GenreStoryKind` union of `"horror" | "mystery" | "sci_fi" | "adventure" | "children" | "historical"`, and make each configuration record contain `slug`, `href`, `pageKey`, `icon`, `genre`, `i18nNamespace`, `messageKey`, and the allowed option keys. `getGenreStoryGenerator` must accept a route slug, while `getGenreStoryGeneratorByGenre` validates a user-supplied genre against that same configuration before any route uses it.

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

Cap the idea at 2,000 characters. Normalize model to `fast | standard | creative` with `standard` as the fallback. Normalize common selector values through each generator configuration: Horror accepts `two_sentence | short | full` and defaults to `short`; Mystery accepts `hook | short | full_outline` and defaults to `short`; other genres use their configured defaults. Keep only options listed for the parsed genre. Horror exposes `horror | spooky | psychological | supernatural` for `horrorMode`, plus `scareIntensity` and `endingType`; Mystery exposes `murder | cozy | locked_room | detective | noir | psychological` for `subgenre`, plus `mysteryIntensity` and `includeTwist`. Use these exact per-genre contracts in `buildGenreStoryPrompt`:

```ts
const GENRE_REQUIREMENTS: Record<GenreStoryKind, string> = {
  horror: "Build dread through the selected horror mode and intensity; honour the requested ending without gratuitous gore. For two-sentence output, deliver one compact setup and one unmistakable turn.",
  mystery: "Plant fair clues, distinguish red herrings from evidence, and make the final solution logically follow from the clues. For hook output, write exactly two lines that establish the case and a compelling unanswered question.",
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

For `generator.genre === "horror"`, render the approved selector labels and values in the first viewport: `horror`, `spooky`, `psychological`, `supernatural`; `two_sentence`, `short`, `full`; intensity; and ending. Below the form, render exactly three static editorial example-output cards from locale data. They must be labelled as examples and must not masquerade as a live user result.

- [ ] **Step 4: Implement the shared server page and six wrappers.**

`createGenreStoryGeneratorMetadata(slug)` must dynamically import `@/i18n/pages/${generator.i18nNamespace}/${locale}.json`, select `messages.default[generator.messageKey]`, and return title, description, Open Graph, Twitter, a locale-aware canonical URL, and `buildLanguageAlternates(generator.href)`. It must not return a `keywords` property. `createGenreStoryGeneratorPage(slug)` must call `setRequestLocale`, render the three JSON-LD objects, then render this section sequence:

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
      assert.equal("keywords" in (section?.metadata || {}), false, `${locale}/${genre} must not add meta keywords`);
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

Every page directory must contain all six locale files, each with one genre-specific root key: `horror_story_generate`, `mystery_story_generate`, `sci_fi_story_generate`, `adventure_story_generate`, `children_story_generate`, or `historical_story_generate`. Each root object must supply `metadata` with only title and description (no `keywords` metadata), `ui`, `placeholders`, `ai_models`, `common_fields`, `genre_fields`, `random_prompts`, `validation`, `success`, `errors`, `output`, `completion_guide`, `feature_intro`, `how_to_use`, `feature_benefits`, `feature_section`, `faq_section`, and `cta_section`.

Use the approved exact input keys: `horrorMode`, `scareIntensity`, `endingType`; `subgenre`, `mysteryIntensity`, `includeTwist`; `sciFiSubgenre`, `scienceMode`, `includeTwist`; `mission`, `location`, `opponent`, `riskLevel`; `ageBand`, `learningGoal`, `vocabularyLevel`, `safety`; `timePeriod`, `location`, `historicalContext`, `fictionRatio`. Page prose and FAQs must explain the corresponding fields; do not use a find-and-replace title template. Horror, Mystery, and Sci-Fi receive their specialized hero examples and SEO content in Tasks 5–7.

Add translated `name` and `desc` entries under `ai_tools.tools` for all six snake-case tool keys in every global messages file.

- [ ] **Step 4: Re-run locale tests.**

Run: `npx tsx --test tests/genre-story-generate-content.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit locale content.**

```bash
git add src/i18n/pages/horror-story-generate src/i18n/pages/mystery-story-generate src/i18n/pages/sci-fi-story-generate src/i18n/pages/adventure-story-generate src/i18n/pages/children-story-generate src/i18n/pages/historical-story-generate src/i18n/messages/en.json src/i18n/messages/zh.json src/i18n/messages/de.json src/i18n/messages/ko.json src/i18n/messages/ja.json src/i18n/messages/ru.json tests/genre-story-generate-content.test.ts
git commit -m "feat: add genre story generator content"
```

### Task 5: Implement the Horror keyword layout and reusable five-title mini-generator

**Files:**
- Create: `src/app/api/genre-story-title-generate/_lib.ts`
- Create: `src/app/api/genre-story-title-generate/route.ts`
- Create: `src/components/blocks/horror-story-seo-content/index.tsx`
- Create: `src/components/blocks/genre-story-title-generator/index.tsx`
- Modify: `src/components/pages/genre-story-generator-page.tsx`
- Modify: `src/types/blocks/genre-story-generate.d.ts`
- Modify: `src/i18n/pages/horror-story-generate/{en,zh,de,ko,ja,ru}.json`
- Test: `tests/genre-story-title-generate-lib.test.ts`
- Test: `tests/genre-story-title-generate-route.test.ts`
- Test: `tests/horror-story-generator-seo.test.ts`

- [ ] **Step 1: Write failing tests for exact Horror metadata, layout, links, and title output.**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildGenreStoryTitlePrompt, parseGenreStoryTitleRequest } from "@/app/api/genre-story-title-generate/_lib";

const page = JSON.parse(readFileSync("src/i18n/pages/horror-story-generate/en.json", "utf8"));
const horror = page.horror_story_generate;

test("Horror uses the approved TDH and visible keyword-layout sections", () => {
  assert.equal(horror.metadata.title, "Free Horror Story Generator – AI Scary Story Maker");
  assert.equal(horror.metadata.description, "Generate creepy plots, cursed characters and two-sentence scares in seconds. Free AI horror story generator — horror story ideas, titles and prompts, no sign-up.");
  assert.equal(horror.ui.title, "Free AI Horror Story Generator");
  assert.equal(horror.ui.subtitle, "Turn one line of an idea into a full horror story, a plot outline or a two-sentence scare — pick a subgenre and generate.");
  assert.equal("keywords" in horror.metadata, false);
  assert.equal(horror.hero_examples.length, 3);
  const fields = Object.fromEntries(horror.genre_fields.map((field: { key: string; options: Record<string, string> }) => [field.key, field.options]));
  assert.deepEqual(Object.keys(fields.horrorMode), ["horror", "spooky", "psychological", "supernatural"]);
  assert.deepEqual(Object.keys(horror.common_fields.length.options), ["two_sentence", "short", "full"]);
  assert.equal(horror.horror_seo.two_sentence_stories.items.length, 12);
  assert.equal(horror.horror_seo.ideas_and_plots.title, "Horror Story Ideas & Plots");
  assert.equal(horror.horror_seo.ideas_and_plots.twist_title, "Horror story ideas with a twist");
  assert.equal(horror.horror_seo.ideas_and_plots.structure_title, "Plot structures that actually scare");
  assert.equal(horror.horror_seo.prompts_by_subgenre.title, "Horror Story Prompts by Subgenre");
  assert.equal(horror.horror_seo.title_generator.title, "Horror Story Titles");
  assert.equal(horror.horror_seo.two_sentence_stories.title, "Two-Sentence Horror Stories");
  assert.equal(horror.horror_seo.how_to.title, "How to Generate a Horror Story with AI");
  assert.equal(horror.horror_seo.audiences.title, "Who Uses a Horror Story Generator");
  assert.equal(horror.horror_seo.video_adaptation.title, "From Horror Story to Video");
  assert.equal(horror.horror_seo.definition.title, "What is a Horror Story Generator?");
  assert.equal(horror.horror_seo.faq_heading, "Frequently Asked Questions");
  assert.deepEqual(horror.horror_seo.internal_links.map((link: { href: string }) => link.href), ["/", "/plot-generator", "/story-prompt-generator", "/book-title-generator", "/ai-write"]);
  assert.equal(horror.horror_seo.video_adaptation.capability_notice, "Stories Generator prepares a video-ready script; it does not render a video file.");
});

test("Horror keeps all approved questions visibly present", () => {
  const questions = horror.faq_section.items.map((item: { title: string }) => item.title);
  for (const question of [
    "How can I create my own scary story?",
    "Can you make me a horror story?",
    "Can ChatGPT write horror stories?",
    "What is the scariest story ever?",
    "What is the best free horror story generator?",
    "Can I make a horror story video from the generated story?",
  ]) assert.ok(questions.includes(question), question);
});

test("title mini-generator accepts a Horror premise and requires exactly five lines", () => {
  const parsed = parseGenreStoryTitleRequest({ genre: "horror", description: "A child hears knocking inside the walls every midnight." });
  assert.equal(parsed.ok, true);
  assert.match(buildGenreStoryTitlePrompt(parsed.value!), /exactly 5/i);
  assert.match(buildGenreStoryTitlePrompt(parsed.value!), /one title per line/i);
});

test("genre title route uses optional Turnstile, configured page quota identity, and shared LLM", () => {
  const source = readFileSync("src/app/api/genre-story-title-generate/route.ts", "utf8");
  assert.match(source, /if \(!secretKey\) return true/);
  assert.match(source, /pageKey: generator\.pageKey/);
  assert.match(source, /fetchChatCompletion/);
  assert.match(source, /resolveModelTier\("fast"\)/);
});
```

- [ ] **Step 2: Run the tests to confirm the Horror-only pieces are missing.**

Run: `npx tsx --test tests/genre-story-title-generate-lib.test.ts tests/genre-story-title-generate-route.test.ts tests/horror-story-generator-seo.test.ts`
Expected: FAIL because the title API and SEO component do not exist; the locale data was added in Task 4 but does not yet have a renderer or title behavior.

- [ ] **Step 3: Implement the isolated five-title API.**

`parseGenreStoryTitleRequest` accepts a supported `genre`, a nonempty `description` of 10–1,200 characters, and an optional locale. Task 5 enables `horror`; Task 6 adds `mystery`; Task 7 adds `sci_fi`. `buildGenreStoryTitlePrompt` must return an instruction that requests exactly five distinct, marketable titles for that genre, one title per line, no numbering, no explanation, no existing-franchise names, and the requested output language.

The route uses the same optional Turnstile behavior as the genre-story route. It resolves `fast` with `resolveModelTier("fast")`, obtains the page key from the validated generator configuration, streams newline-safe output through the existing `0:"..."` protocol, and caps rendered client output at the first five nonempty lines. This makes the UI contract exactly five titles even if a provider misbehaves. The route must use `prepareCreativeQuota`, `fetchChatCompletion`, `commitCreativeQuotaCharge`, and `withCreativeVisitorCookie`; it must not call provider URLs directly.

- [ ] **Step 4: Implement the Horror SEO component and wire it after the shared generator.**

`HorrorStorySeoContent` receives the typed `horror_seo` object. It renders the approved H2/H3 list from the SEO brief, starts each section with an answer-bearing paragraph, and uses locale data rather than hardcoded prose. It delegates the interactive title behavior to the reusable component:

```tsx
<section aria-labelledby="horror-titles">
  <h2 id="horror-titles">{section.title_generator.title}</h2>
  <GenreStoryTitleGenerator genre="horror" section={section.title_generator} />
</section>
```

`HorrorStorySeoContent` embeds `GenreStoryTitleGenerator` with `genre="horror"`. The shared title component uses a dedicated `TurnstileInvisible` ref and calls `/api/genre-story-title-generate` only after success. It presents provider errors through the translated error string and does not claim unlimited generations. The Horror video-adaptation block must visibly include the locale `capability_notice` and link to `/ai-write` as the current continuation workflow, not to a nonexistent video route.

Modify `createGenreStoryGeneratorPage` to render this component immediately after `<GenreStoryGenerate>` only when `generator.genre === "horror"`:

```tsx
{generator.genre === "horror" && section.horror_seo ? (
  <HorrorStorySeoContent section={section.horror_seo} />
) : null}
```

Use the typed links supplied by locale data, but reject any href outside `/`, `/plot-generator`, `/story-prompt-generator`, `/book-title-generator`, and `/ai-write` in the component's development-time invariant. Do not render anchors for absent scary/spooky/ghost/Halloween/creepypasta/analog-horror/Christmas-horror routes.

- [ ] **Step 5: Complete Horror locale data in all six languages.**

In each Horror locale JSON, add `hero_examples`, the exact four Horror-mode values, exactly three length values, `horror_seo`, six visible FAQs, and the approved internal-link list. English uses the TDH and H2/H3 text in the SEO brief verbatim. Each `two_sentence_stories.items` array contains exactly 12 original examples; do not reuse examples from another locale as purported translation-free English content. Non-English files translate the full visible interface and examples while preserving their own title/description language and the same product facts.

- [ ] **Step 6: Re-run Horror tests and the earlier content test.**

Run: `npx tsx --test tests/genre-story-generate-content.test.ts tests/genre-story-title-generate-lib.test.ts tests/genre-story-title-generate-route.test.ts tests/horror-story-generator-seo.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit the Horror specialization.**

```bash
git add src/app/api/genre-story-title-generate src/components/blocks/genre-story-title-generator src/components/blocks/horror-story-seo-content src/components/pages/genre-story-generator-page.tsx src/types/blocks/genre-story-generate.d.ts src/i18n/pages/horror-story-generate tests/genre-story-title-generate-lib.test.ts tests/genre-story-title-generate-route.test.ts tests/horror-story-generator-seo.test.ts
git commit -m "feat: add horror story SEO experience"
```

### Task 6: Implement the Mystery keyword layout with the shared title tool

**Files:**
- Create: `src/components/blocks/mystery-story-seo-content/index.tsx`
- Modify: `src/app/api/genre-story-title-generate/_lib.ts`
- Modify: `src/app/api/genre-story-title-generate/route.ts`
- Modify: `src/components/pages/genre-story-generator-page.tsx`
- Modify: `src/types/blocks/genre-story-generate.d.ts`
- Modify: `src/i18n/pages/mystery-story-generate/{en,zh,de,ko,ja,ru}.json`
- Test: `tests/mystery-story-generator-seo.test.ts`
- Test: `tests/genre-story-title-generate-lib.test.ts`
- Test: `tests/genre-story-title-generate-route.test.ts`

- [ ] **Step 1: Write failing tests for the Mystery TDH, form values, SEO blocks, FAQs, and reusable title genre.**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseGenreStoryTitleRequest } from "@/app/api/genre-story-title-generate/_lib";

const page = JSON.parse(readFileSync("src/i18n/pages/mystery-story-generate/en.json", "utf8"));
const mystery = page.mystery_story_generate;

test("Mystery uses the approved TDH and first-viewport controls", () => {
  assert.equal(mystery.metadata.title, "Free Mystery Story Generator – AI Mystery Plot Maker");
  assert.equal(mystery.metadata.description, "Generate a mystery plot, clue trail and twist ending in seconds. Free AI mystery story generator — mystery story ideas, titles and prompts, no sign-up.");
  assert.equal(mystery.ui.title, "Free AI Mystery Story Generator");
  assert.equal(mystery.ui.subtitle, "Give it a setting, a victim and a suspect list — get a full mystery plot, a short story or a two-line hook you can build on.");
  assert.equal("keywords" in mystery.metadata, false);
  assert.equal(mystery.hero_examples.length, 3);
  const fields = Object.fromEntries(mystery.genre_fields.map((field: { key: string; options: Record<string, string> }) => [field.key, field.options]));
  assert.deepEqual(Object.keys(fields.subgenre), ["murder", "cozy", "locked_room", "detective", "noir", "psychological"]);
  assert.deepEqual(Object.keys(mystery.common_fields.length.options), ["hook", "short", "full_outline"]);
});

test("Mystery has answer-bearing content and no dead canonical links", () => {
  for (const title of [
    "Mystery Story Ideas & Plot Outlines", "Mystery Story Prompts by Subgenre", "Murder Mystery Generator",
    "Mystery Story Titles", "How to Build a Mystery Plot Step by Step", "Clues, Red Herrings and the Twist",
    "Mystery vs Thriller: Which Generator Do You Need?", "Who Uses a Mystery Story Generator",
    "What is a Mystery Story Generator?", "Frequently Asked Questions",
  ]) assert.ok(mystery.mystery_seo.headings.includes(title), title);
  assert.deepEqual(mystery.mystery_seo.internal_links.map((link: { href: string }) => link.href), ["/", "/horror-story-generator"]);
  assert.equal(mystery.mystery_seo.story_ideas.href, null);
});

test("Mystery keeps all approved questions visibly present", () => {
  const questions = mystery.faq_section.items.map((item: { title: string }) => item.title);
  for (const question of [
    "Is there a free mystery story generator?", "Can AI write a good mystery story?",
    "How do I come up with a mystery plot?", "Can I generate a fantasy mystery story?",
    "Can I generate a romance mystery story?", "What's the difference between a mystery and a thriller?",
    "Can I generate a crime story instead?",
  ]) assert.ok(questions.includes(question), question);
});

test("the shared title parser accepts Mystery without accepting an arbitrary genre", () => {
  assert.equal(parseGenreStoryTitleRequest({ genre: "mystery", description: "A detective finds three alibis that cannot all be true." }).ok, true);
  assert.equal(parseGenreStoryTitleRequest({ genre: "crime", description: "A detective finds three alibis that cannot all be true." }).ok, false);
});
```

- [ ] **Step 2: Run the tests to confirm the Mystery specialization is absent.**

Run: `npx tsx --test tests/mystery-story-generator-seo.test.ts tests/genre-story-title-generate-lib.test.ts tests/genre-story-title-generate-route.test.ts`
Expected: FAIL because the baseline Mystery locale data lacks `mystery_seo` and the shared title parser does not yet accept `mystery`.

- [ ] **Step 3: Extend the reusable title path for Mystery.**

Add `mystery` to the allowed title-generator genres and resolve its `pageKey` via `getGenreStoryGenerator` rather than a route-local conditional. The Mystery title prompt must ask for exactly five distinctive mystery titles and favor clues, suspects, a case, atmosphere, or a reveal without revealing the solution. Preserve the existing Horror behavior and all five-line output safeguards.

- [ ] **Step 4: Implement `MysteryStorySeoContent` and render it after the shared generator.**

The component receives typed `mystery_seo`, uses `GenreStoryTitleGenerator` with `genre="mystery"`, renders the approved H2/H3 list, and leads each section with a concise direct answer. Its four-step block must visibly follow `crime → clues → suspects → reveal`; its comparison section must distinguish Mystery's puzzle/solution focus from Thriller's danger/urgency focus without claiming that a Thriller generator exists.

Render the component only for `generator.genre === "mystery"` immediately after `<GenreStoryGenerate>`. The Murder Mystery block and Mystery Story Ideas block render as explanatory content with `href: null` until their respective canonical pages are actually published. The only links in this milestone are `/` with the `AI story generator` anchor and `/horror-story-generator` with the `horror story generator` anchor.

- [ ] **Step 5: Complete Mystery locale data in all six languages.**

Each Mystery locale root adds `hero_examples`, `mystery_seo`, the approved form values, seven visible FAQ items, and the shared title-tool labels. English uses the approved TDH and headings verbatim. Provide three clearly labelled editorial examples: a locked-room clue list, a noir opening, and a three-suspect wheel. Do not add `meta keywords`, `Unlimited`, links to nonexistent murder/blog/thriller/crime pages, or a title that asserts the tool can solve real crimes.

- [ ] **Step 6: Re-run the Mystery, title, and baseline content tests.**

Run: `npx tsx --test tests/genre-story-generate-content.test.ts tests/mystery-story-generator-seo.test.ts tests/genre-story-title-generate-lib.test.ts tests/genre-story-title-generate-route.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit the Mystery specialization.**

```bash
git add src/components/blocks/mystery-story-seo-content src/app/api/genre-story-title-generate src/components/pages/genre-story-generator-page.tsx src/types/blocks/genre-story-generate.d.ts src/i18n/pages/mystery-story-generate tests/mystery-story-generator-seo.test.ts tests/genre-story-title-generate-lib.test.ts tests/genre-story-title-generate-route.test.ts
git commit -m "feat: add mystery story SEO experience"
```

### Task 7: Implement the Sci-Fi keyword layout with the shared title tool

**Files:**
- Create: `src/components/blocks/sci-fi-story-seo-content/index.tsx`
- Modify: `src/app/api/genre-story-title-generate/_lib.ts`
- Modify: `src/components/blocks/genre-story-title-generator/index.tsx`
- Modify: `src/components/pages/genre-story-generator-page.tsx`
- Modify: `src/types/blocks/genre-story-generate.d.ts`
- Modify: `src/i18n/pages/sci-fi-story-generate/{en,zh,de,ko,ja,ru}.json`
- Test: `tests/sci-fi-story-generator-seo.test.ts`
- Test: `tests/genre-story-title-generate-lib.test.ts`

- [ ] **Step 1: Write failing tests for Sci-Fi metadata, hero controls, retrieval sections, FAQ, safe links, and title support.**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseGenreStoryTitleRequest } from "@/app/api/genre-story-title-generate/_lib";

const page = JSON.parse(readFileSync("src/i18n/pages/sci-fi-story-generate/en.json", "utf8"));
const sciFi = page.sci_fi_story_generate;

test("Sci-Fi uses the approved TDH and first-viewport controls", () => {
  assert.equal(sciFi.metadata.title, "Sci-Fi Story Generator – Free AI Science Fiction Plot Maker");
  assert.equal(sciFi.metadata.description, "Generate a sci-fi plot, world and cast in seconds — hard SF, space opera, cyberpunk or dystopian. Free AI sci-fi story generator with ideas, prompts and titles, no sign-up.");
  assert.equal(sciFi.ui.title, "Free AI Sci-Fi Story Generator");
  assert.equal(sciFi.ui.subtitle, "Pick a subgenre and a length — get a full plot outline, a short story, or a one-line hook built around your world.");
  assert.equal("keywords" in sciFi.metadata, false);
  assert.equal(sciFi.hero_examples.length, 3);
  const fields = Object.fromEntries(sciFi.genre_fields.map((field: { key: string; options: Record<string, string> }) => [field.key, field.options]));
  assert.deepEqual(Object.keys(fields.sciFiSubgenre), ["hard_sf", "space_opera", "cyberpunk", "dystopian", "time_travel", "first_contact", "ai_uprising", "post_apocalyptic"]);
  assert.deepEqual(Object.keys(sciFi.common_fields.length.options), ["hook", "short", "full_outline"]);
  assert.deepEqual(Object.keys(fields.scienceMode), ["hard_sf", "space_opera"]);
});

test("Sci-Fi has answer-bearing sections and only live canonical links", () => {
  for (const title of [
    "Sci-Fi Story Ideas & Plot Outlines", "Sci-Fi Writing Prompts by Subgenre", "Worldbuilding: Settings, Species, Tech",
    "Sci-Fi Story Titles", "How to Generate a Sci-Fi Story in 4 Steps", "Make It Believable: The One Rule of Hard SF",
    "Sci-Fi vs Fantasy: Which Generator Do You Need?", "Who Uses a Sci-Fi Story Generator",
    "What is a Sci-Fi Story Generator?", "Frequently Asked Questions",
  ]) assert.ok(sciFi.sci_fi_seo.headings.includes(title), title);
  assert.deepEqual(sciFi.sci_fi_seo.internal_links.map((link: { href: string }) => link.href), ["/", "/horror-story-generator", "/mystery-story-generator", "/fantasy-generator"]);
  assert.equal(sciFi.sci_fi_seo.name_generator.href, null);
  assert.equal(sciFi.sci_fi_seo.story_ideas.href, null);
  assert.equal(sciFi.sci_fi_seo.writing_prompts.href, null);
});

test("Sci-Fi keeps all approved questions visibly present", () => {
  const questions = sciFi.faq_section.items.map((item: { title: string }) => item.title);
  for (const question of [
    "Is there a free sci-fi story generator?", "Can AI write a good science fiction story?",
    "Can I generate a fantasy story instead?", "Can I generate a romance sci-fi story?",
    "What is a sci-fi backstory generator?", "How long a story can it generate?",
    "What's the difference between sci-fi and fantasy?",
  ]) assert.ok(questions.includes(question), question);
});

test("the shared title parser accepts Sci-Fi without accepting adjacent non-story tasks", () => {
  assert.equal(parseGenreStoryTitleRequest({ genre: "sci_fi", description: "A generation ship reaches a planet whose ruins predict every colonist's death." }).ok, true);
  assert.equal(parseGenreStoryTitleRequest({ genre: "sci_fi_name", description: "Names for alien captains" }).ok, false);
});
```

- [ ] **Step 2: Run the tests to confirm the Sci-Fi specialization is absent.**

Run: `npx tsx --test tests/sci-fi-story-generator-seo.test.ts tests/genre-story-title-generate-lib.test.ts`
Expected: FAIL because the base Sci-Fi locale lacks `hero_examples` and `sci_fi_seo`, the renderer does not exist, and the title parser does not yet accept `sci_fi`.

- [ ] **Step 3: Extend the shared title path for Sci-Fi.**

Add `sci_fi` to the supported title-generator genres and resolve its `pageKey` from the shared generator configuration. The Sci-Fi prompt must ask for exactly five distinct titles that reflect the supplied setting, conflict, technology rule, or world consequence. Preserve the no-numbering, no-franchise-name, exactly-five-line contract and existing Horror/Mystery behavior.

- [ ] **Step 4: Implement `SciFiStorySeoContent` and render it after the shared generator.**

The component receives typed `sci_fi_seo`, uses `GenreStoryTitleGenerator` with `genre="sci_fi"`, renders the approved H2/H3 list, and begins each section with a concise, answer-bearing paragraph. It must show one prompt example for each of the eight subgenres; explain worldbuilding as settings, species, and tech rules with downstream plot consequences; and make the four-step section visibly follow `world → conflict → tech rule → twist`.

The comparison section must distinguish science-fiction's extrapolated rules and consequences from fantasy's magic or mythic rules. It links the `fantasy story generator` anchor to the existing canonical `/fantasy-generator`; it does not propose or create a duplicate fantasy URL. Render this component only when `generator.genre === "sci_fi"` immediately after `<GenreStoryGenerate>`.

Allow only `/`, `/horror-story-generator`, `/mystery-story-generator`, and `/fantasy-generator` as Sci-Fi SEO-content hrefs. `sci fi name generator`, `sci fi story ideas`, and `sci fi writing prompts` remain visible explanatory text with `href: null` until an independently approved and published page exists. Do not create a name-generator, blog, romance, or genre-alias route in this milestone.

- [ ] **Step 5: Complete Sci-Fi locale data in all six languages.**

Each Sci-Fi locale root adds `hero_examples`, `sci_fi_seo`, eight subgenre options, `scienceMode`, `includeTwist`, seven visible FAQ items, and shared title-tool labels. English uses the approved TDH and headings verbatim. The three labelled editorial examples are a space-opera opening, an AI-awakening three-act outline, and a ship-or-colony setting sheet. Use `Free • No sign-up required • Start instantly`; do not add `meta keywords`, `Unlimited`, or links to nonexistent name-generator or blog URLs.

- [ ] **Step 6: Re-run the Sci-Fi, title, and baseline content tests.**

Run: `npx tsx --test tests/genre-story-generate-content.test.ts tests/sci-fi-story-generator-seo.test.ts tests/genre-story-title-generate-lib.test.ts tests/genre-story-title-generate-route.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit the Sci-Fi specialization.**

```bash
git add src/components/blocks/sci-fi-story-seo-content src/app/api/genre-story-title-generate/_lib.ts src/components/blocks/genre-story-title-generator/index.tsx src/components/pages/genre-story-generator-page.tsx src/types/blocks/genre-story-generate.d.ts src/i18n/pages/sci-fi-story-generate tests/sci-fi-story-generator-seo.test.ts tests/genre-story-title-generate-lib.test.ts
git commit -m "feat: add sci-fi story SEO experience"
```

### Task 8: Register all six tools and verify sitemap coverage

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

Run: `npx tsx --test tests/genre-story-generate-lib.test.ts tests/genre-story-generate-route.test.ts tests/genre-story-generate-page.test.ts tests/genre-story-generate-content.test.ts tests/genre-story-title-generate-lib.test.ts tests/genre-story-title-generate-route.test.ts tests/horror-story-generator-seo.test.ts tests/mystery-story-generator-seo.test.ts tests/sci-fi-story-generator-seo.test.ts tests/genre-story-generate-site-registration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit registrations.**

```bash
git add src/services/tools.ts src/app/sitemap.ts tests/genre-story-generate-site-registration.test.ts
git commit -m "feat: register genre story generators"
```

### Task 9: Perform production-level verification

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

- Spec coverage: Tasks 1–2 implement six typed, genre-specific generation contracts; Task 3 supplies six fixed canonical pages, shared UX, JSON-LD, alternates, saving, and continuation; Task 4 provides all six locales and unique SEO content; Tasks 5–7 add the approved Horror, Mystery, and Sci-Fi retrieval layouts plus the shared five-title tool; Task 8 registers cards, quota keys, and both Sitemap lists; Task 9 runs targeted tests, lint, and build.
- Scope: Old genre URLs, `/story-generate`, community pages, redirects, and the second-phase tool cluster are explicitly untouched. `Murder Mystery Generator` remains an on-page Mystery section rather than a planned child route. Sci-Fi naming and information-content opportunities are not silently added as generator or `/blog` routes. The information article is separately editorial work and is not silently added to the existing `/posts` architecture.
- Type consistency: Route slug, `pageKey`, `GenreStoryKind`, locale `genre_fields.key`, i18n namespace/root key, and API `options` are connected through `src/lib/genre-story-generators.ts`; fixed page wrappers pass slugs while API requests pass kind values.
- No placeholders: all planned routes, field keys, quota identities, prompt contracts, test files, and commands are named above.
