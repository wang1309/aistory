# Story Summarizer Design

## Goal

Add `story-summarizer` as a free, pasted-text entry tool at
`/ai-tools/story-summarizer`. It lets a writer summarize a chapter or story,
see the important plot and character changes, then move into the existing AI
Write Story Bible and Consistency Check workflow.

The product position is: **Summarize a chapter, track its characters, then
continue writing.** It is an SEO and activation entry point, not a standalone
paid product or a replacement for the AI Write workbench.

## Scope

- Accept pasted story text only; do not support file upload, URL import,
  project storage, history, or cross-session memory.
- Enforce a 20,000-character maximum after trimming in both the browser and
  the API. The UI tells users to summarize long manuscripts in parts.
- Let the user select an approximate summary target of 50, 150, or 500 words.
- Let the user choose `Full summary` or `Premise only`. Premise-only output
  must not reveal later twists, climaxes, endings, or final character states.
- Return a stable, structured result: summary, plot beats, character roles and
  changes, themes, and central conflict.
- Generate output in the language of the pasted story, regardless of the page
  locale. The prompt makes this requirement explicit; it does not attempt
  client-side language detection.
- Reuse the established Turnstile, anonymous creative-quota, visitor-cookie,
  GRSAI, OpenPanel, six-locale, tools-registry, and sitemap conventions.
- Add destination CTAs to the existing AI Write, Story Bible, and Consistency
  Check workflow. These are navigation actions only; no source story or result
  is encoded in a URL, browser storage, or analytics payload.

## Non-goals

- No `book-chapter-summarizer`, `novel-synopsis-generator`, or generic content
  summarizer variant in this release.
- No paid tier, subscription change, uploaded-document parsing, persistence,
  share links, batch jobs, or asynchronous processing.
- No newly implemented Story Bible, entity graph, consistency engine, or
  automatic import of extracted characters into AI Write.
- No claim that a summary is a factual substitute for reading the source text.
- No tracking, logging, or persistence of user-supplied story text.

## UX

### Input and controls

The generator block contains one prominent multiline story-text field with a
live `current / 20,000` character counter, a three-option summary-length
segmented control (`50`, `150`, `500 words`), and a two-option spoiler-mode
segmented control (`Full summary`, `Premise only`). The default is 150 words
and full summary. The Generate action is disabled for whitespace-only input or
over-limit input, and mirrors the API validation error when a request is
rejected.

The page locale localizes labels, help text, errors, metadata, and editorial
content. The story itself is the authority for output language. Word counts are
targets rather than exact hard caps, since a word is not comparable across
CJK and whitespace-separated languages; the prompt requests a concise output
approximately matching the selected target.

### Result

After a successful request, render a fixed-order, copyable result surface:

1. `Summary` — prose at the selected approximate length;
2. `Main plot beats` — ordered concise list;
3. `Characters` — name (or unambiguous role if unnamed), story role, and
   change/arc observed in the supplied text;
4. `Themes and central conflict` — theme list and a separate conflict
   statement.

Premise-only mode retains the same sections, but all fields are limited to
setup and early disclosed information. It does not silently omit a section;
when the source lacks enough information, the model says that the information
is not established in the supplied excerpt.

Provide `Copy result` for a readable plain-text export. Do not add a download,
share, save, or browser-draft mechanism. A visible result action offers
`Continue in AI Write`; a secondary contextual link points writers to Story
Bible and Consistency Check inside that existing workspace. Navigation starts
with a clean AI Write context, so private source material never leaves the
current request merely to create a CTA.

### States and accessibility

The generator presents localized validation errors before Turnstile runs,
shows an in-progress state while the server returns the complete structured
result, and preserves the entered source text when generation fails. Invalid
or unusable provider output becomes a localized generic generation error; raw
provider text is never rendered as a partial result. Controls are keyboard
operable, segmented controls expose their selected state, loading controls
remain dimensionally stable, and the completed result announces through an
`aria-live="polite"` region. Copy failure retains the result and displays a
localized toast.

## Architecture

### Pure server contract

Create `src/app/api/story-summarizer/_lib.ts` as the only pure validation,
prompt, and provider-result boundary. It exports:

```ts
export const STORY_SUMMARIZER_TEXT_LIMIT = 20_000;
export type StorySummaryLength = "50" | "150" | "500";
export type StorySpoilerMode = "full" | "premise";

export interface StorySummarizerInput {
  storyText: string;
  summaryLength: StorySummaryLength;
  spoilerMode: StorySpoilerMode;
}

export interface StorySummaryCharacter {
  name: string;
  role: string;
  change: string;
}

export interface StorySummaryResult {
  summary: string;
  plotBeats: string[];
  characters: StorySummaryCharacter[];
  themes: string[];
  centralConflict: string;
}
```

`parseStorySummarizerInput` trims text, rejects missing or over-limit text,
and normalizes unknown selector values to the safe defaults (`150`, `full`),
matching the tolerant enum behavior of nearby generators. `buildStorySummaryPrompt`
keeps untrusted story text in a clearly delimited data section and requires the
model to treat instructions embedded in that text as story content, not
commands.

The prompt requires a single JSON object matching `StorySummaryResult`, with
no Markdown fences or surrounding commentary. It tells the model to use the
source text's language; distinguish unestablished facts from facts in the
excerpt; follow the requested approximate length; and apply premise-only
spoiler restrictions to every section, not just the prose summary. It limits
arrays to concise useful entries (up to 8 plot beats, 12 characters, and 6
themes) so a long source cannot produce an unwieldy interface.

`parseStorySummaryResult` removes only an accidental Markdown code fence,
parses JSON, and validates required non-empty strings and bounded arrays.
It rejects malformed, empty, or overlong individual fields rather than passing
untrusted model shape to React. The page does not use a retry after a malformed
result: a retry would introduce unpredictable delay and quota semantics. The
user can submit another request.

### API route

Create `src/app/api/story-summarizer/route.ts`, following the existing
AI-generator sequence exactly:

1. Parse JSON and validate with the pure library before any provider call.
2. Verify Turnstile, retaining the existing behavior that server-side
verification is auto-skipped when `TURNSTILE_SECRET_KEY` is unset.
3. Call `prepareCreativeQuota` with page key `story-summarizer` and the chosen
model; return the standard quota response if denied.
4. Call GRSAI `/v1/chat/completions` with `stream: false`, a mapped existing
model selection, a system prompt enforcing structured summarization, and the
user prompt from `_lib.ts`.
5. Extract the provider content, validate it through `parseStorySummaryResult`,
and return the established `{ code, message, data }` response shape.
6. Call `commitCreativeQuotaCharge` only after GRSAI responds successfully
and `parseStorySummaryResult` validates its content. Wrap every exit after
quota preparation with `withCreativeVisitorCookie`.

The route never logs source text, prompts, model output, or request bodies.
Operational error logging contains only status/context safe for the existing
logger policy. Server-side, non-streaming JSON is intentional: rendering only
a validated complete result prevents malformed partial JSON from becoming a
broken UI contract.

### Client block

Create `src/components/blocks/story-summarizer/index.tsx` as the client owner
of input, selected controls, Turnstile invocation, quota gates, request state,
result state, copying, and activation tracking. It uses the current
`TurnstileInvisible`, `useCreativeQuotaPage`, app context, localized navigation
router, `useOpenPanel`, and standard UI primitives. It must not auto-save story
text through `useDraftAutoSave`, `localStorage`, `sessionStorage`, or a URL.

The client repeats the 20,000-character check before submitting, includes only
the selected model, text, summary length, spoiler mode, page locale, and
Turnstile token in the request, and consumes the normal JSON response. It
renders only the validated `data` object, never arbitrary provider content.

OpenPanel events use existing activation-event names where possible:
`generation_started`, `generation_succeeded`, `generation_failed`, and
`result_copied`. The CTA click uses a new narrow activation event only if the
existing event catalog lacks a semantically correct navigation event. Event
properties are restricted to source page (`story-summarizer`), login state,
summary length, spoiler mode, model, and an input-size bucket (`1-500`,
`501-2000`, `2001-5000`, `5001-20000`). They never contain story text,
summary text, characters, themes, titles, or inferred language.

### Page, types, and localization

Create the page at
`src/app/[locale]/(default)/ai-tools/story-summarizer/page.tsx`, modeled on
the established AI tools page pattern. It loads
`src/i18n/pages/story-summarizer/<locale>.json`, sets locale and SEO metadata,
renders the generator and supporting editorial sections, and emits
`BreadcrumbList`, `WebApplication`, and `FAQPage` JSON-LD where the page
content supplies FAQs. It declares the tool free and uses the canonical
`/ai-tools/story-summarizer` route with all locale alternates.

Create `src/types/blocks/story-summarizer.d.ts` for the parallel page-data
shape. Add equivalent content files for `en`, `zh`, `de`, `ko`, `ja`, and `ru`.
The English H1 is `Story Summarizer`; its supporting copy covers chapter and
story summarization, spoiler choice, and output-language behavior without
claiming that uploads or long-manuscript processing exist. Add the matching
`ai_tools.tools.story_summarizer` card copy to each of the six global message
files. Register any page-copy icon in `src/components/icon/index.tsx` only if
it is not already exported.

### Discovery and destinations

Register `story-summarizer` in `src/services/tools.ts` with module
`ai-tools`, a suitable existing writing category, href
`/ai-tools/story-summarizer`, an existing Remix icon, card-copy key, and
priority aligned with neighboring writing tools. Add the route to both the
`routes` array and `TOOL_ROUTES` in `src/app/sitemap.ts`. No legacy root-level
route exists, so no redirect is needed.

The exact AI Write links must use the existing locale-aware navigation helpers
and current canonical AI Write route. The implementation will inspect their
available destinations before choosing link text, but does not invent a new
query parameter or prefill transport.

## Error Handling and Privacy

- API validation failures return `respErr` before Turnstile, quota, or GRSAI.
- Missing/invalid Turnstile, denied quota, missing API key, provider failure,
  empty content, and result-schema failure return a user-safe error with the
  creative visitor cookie when a quota gate was prepared.
- A provider response that is syntactically valid JSON but fails the result
  schema is an API failure, not a partially rendered success.
- The client preserves source text and chosen controls after all recoverable
  failures, and does not expose raw backend/provider diagnostics.
- Source and output text stay in the browser/API request path only. They are
  excluded from analytics, console logging, browser persistence, metadata,
  error strings, URLs, and server-side persistent storage.

## Tests

Add focused Node/tsx tests before implementation:

1. `tests/story-summarizer-lib.test.ts`
   - empty and over-20,000 source validation;
   - trim behavior, safe enum defaults, and prompt requirements for language,
     spoiler mode, untrusted input, selected length, and JSON-only output;
   - valid result parsing, accidental code-fence handling, and rejection of
     malformed/empty/out-of-bound shapes.
2. `tests/story-summarizer-route.test.ts`
   - route structure uses `_lib.ts`, Turnstile, quota preparation/commit,
     visitor-cookie wrapper, GRSAI, non-streaming response, and `respData` /
     `respErr` contract;
   - source-level guard that story text is not logged or placed in analytics.
3. `tests/story-summarizer-page.test.ts`
   - page route, English H1, metadata alternates, JSON-LD, input limit,
     controls, structured result sections, copy action, and AI Write CTA;
   - six-locale parallel data structure and content keys.
4. `tests/story-summarizer-site-registration.test.ts`
   - tools registry item, global card copy in all locales, icon availability,
     tools hub discovery, and both sitemap registrations.
5. Extend the appropriate activation-funnel test only when a new CTA event is
   actually required; otherwise use the existing event coverage.

Run the new focused tests, plus any directly affected quota/activation tests,
then `pnpm lint` and `pnpm build`. The known unrelated failures in the full
test suite remain out of scope and must be reported rather than repaired.

## Acceptance Criteria

- A user can paste up to 20,000 characters, select one of three lengths and
  either spoiler mode, and receive a clean structured result in the source
  text's language.
- Both browser and API reject blank or over-limit input before an AI call.
- Premise-only output does not disclose events after the initial setup in any
  result section.
- No result is displayed unless it passes the defined structured-response
  validation.
- The page makes both the core result and the existing AI Write continuation
  path usable on desktop and mobile.
- The tool is discoverable from the tools registry and sitemap, has complete
  six-locale UI/page/card content, and does not record story content in
  analytics or persistent storage.
