# YouTube Title Decision Tool Design

## Summary

This feature targets consistently publishing small-to-mid-size YouTube creators who already have video ideas and production habits, but still struggle to choose the best title before publishing. The product should not behave like a generic "YouTube title generator." It should help users compare multiple title strategies and select the title that is most worth testing.

The recommended MVP is a title decision tool with four core strengths:

- generate multiple title candidates from structured video context
- organize results by title strategy instead of a flat list
- surface the tradeoffs that matter before publishing
- help users shortlist and select one final title with confidence

## Problem

Most existing YouTube title generators stop at idea generation. They provide title suggestions, but do not solve the actual decision problem:

- creators do not know which title angle is strongest
- AI titles are often generic or disconnected from the real video
- titles may be too long, too vague, too aggressive, or too search-heavy
- users still need to decide whether a title fits browse traffic, search traffic, and the thumbnail

The product opportunity is not better title volume. The product opportunity is better pre-publish title decision support.

## Target User

### Primary User

Consistently publishing YouTube creators who:

- upload videos regularly
- care about CTR and packaging quality
- can provide a summary for most videos
- are willing to provide a transcript for important uploads

### Explicitly Out of Scope for MVP

- complete beginners who only want a few quick ideas
- agencies or teams needing bulk workflows
- enterprise channels needing deep analytics or approval flows

## User Goals

Users want to:

- turn a topic, summary, or transcript into stronger titles
- compare different title strategies instead of minor rewrites
- understand why one title may outperform another
- avoid titles that are too long, misleading, or disconnected from the video
- publish with more confidence instead of relying only on trial and error

## Jobs To Be Done

- When I am about to publish a YouTube video, help me generate title options from my real video context so I can choose a stronger title faster.
- When I have multiple possible titles, help me compare their likely strengths and weaknesses so I can decide which one is most worth testing.
- When I am optimizing for click-through rate, help me balance curiosity, clarity, and honesty so I do not choose a title that overpromises or gets ignored.

## Product Positioning

### Positioning Statement

For actively publishing YouTube creators, this tool helps users choose a stronger title before publishing, not just generate more title ideas.

### Product Promise

"From title ideas to title decisions."

## Scope

### MVP Goals

- support lightweight input through topic, audience, and summary
- optionally support transcript input for higher-fidelity outputs
- generate titles grouped by strategic angle
- make it easy to shortlist and compare 1 to 3 candidates
- recommend one final title with reasoning

### Non-Goals

- pulling live performance data from YouTube
- automatic post-publish optimization
- full YouTube Studio integration
- complete description, tags, and chapter automation
- large-team collaboration workflows

## Functional Requirements

### 1. Guided Input Form

The form should collect the minimum context needed to improve relevance while staying fast for repeat creators.

Required fields:

- `videoTopic`: the topic or promise of the video
- `targetAudience`: who the video is for
- `summary`: a concise summary of the video content

Optional fields:

- `transcript`: full or partial transcript for higher-fidelity generation
- `titleLengthPreference`: short, medium, or flexible
- `optimizationPreference`: more search-oriented, more click-oriented, or balanced
- `avoidWords`: comma-separated list of words or phrases to avoid

### 2. Title Generation

The system should generate 12 candidates grouped into 4 strategy buckets:

- `search-first`
- `curiosity-first`
- `outcome-first`
- `contrarian-first`

Each group should contain 3 titles.

Each result must include:

- `title`
- `angle`
- `characterCount`
- `truncationRisk`
- `keywordPlacement`
- `authenticityRisk`
- `oneLineReason`
- `bestUseCase`

### 3. Strategy Explanation

The interface must explain what each title angle is for:

- `search-first`: clearer and stronger for explicit search intent
- `curiosity-first`: stronger suspense or intrigue for browse traffic
- `outcome-first`: emphasizes payoff, result, or transformation
- `contrarian-first`: emphasizes disagreement, tension, or surprise

This framing is critical because users should understand they are comparing strategies, not random variations.

### 4. Title Diagnostics

Each title card should display lightweight diagnostics:

- `characterCount`
- `truncationRisk`
- `keywordPlacement`
- `authenticityRisk`

These should not be framed as absolute truth. They are decision-support heuristics.

### 5. Shortlist Comparison

Users can save up to 3 titles into a shortlist.

The compare module should show:

- title text
- angle
- best use case
- strengths
- risks
- recommended thumbnail tension level

The compare module should help users decide, not bury them in pseudo-scoring.

### 6. Final Recommendation

Once the user has results, the product should recommend one final title and explain:

- why it is the strongest all-around option
- what it gains
- what it sacrifices
- when the backup title may be the better choice

## Information Architecture

### Page Type

This should be a single landing-and-tool page consistent with the existing generator pages in the codebase.

### Page Sections

1. Hero
2. Guided input panel
3. Strategy-grouped results
4. Shortlist compare module
5. Final recommendation module
6. FAQ / trust / supporting content

### Hero

Purpose:

- clarify that the tool helps choose titles, not just generate them
- make transcript support visible but secondary

Recommended message:

- headline: "Choose a YouTube title worth testing before you publish"
- subheadline: "Generate multiple title angles from your summary or transcript, compare them, and pick the strongest option with more confidence."

Primary CTA:

- `Generate Titles`

### Guided Input Panel

Purpose:

- stay fast for repeat users
- support optional depth for important uploads

Recommended default fields:

1. What is your video about?
2. Who is it for?
3. Summarize the video in a few sentences

Recommended advanced fields:

1. Paste your transcript
2. How long should the title be?
3. Should this lean more toward search or clicks?
4. Any words to avoid?

### Results Area

Purpose:

- help users see strategic differences immediately
- reduce overwhelm from a long flat list

Recommended behavior:

- show 4 angle groups
- within each group, display 1 strongest default card and allow users to inspect the others
- keep card diagnostics lightweight and scannable

### Shortlist Compare Area

Purpose:

- move the user from browsing to choosing

Recommended behavior:

- appears after the first saved title
- supports up to 3 saved candidates
- labels titles by likely use case rather than only numeric scores

### Recommendation Area

Purpose:

- close the decision loop
- reduce last-minute uncertainty

Recommended output:

- recommended final title
- one backup title
- concise explanation of why the primary title wins

## User Flow

1. User lands on the tool page
2. User enters video topic, audience, and summary
3. User optionally adds transcript and advanced preferences
4. User submits the form
5. System generates 4 groups of titles
6. User reviews title cards and saves up to 3 titles
7. Compare module appears and helps narrow the decision
8. System recommends one final title
9. User copies the chosen title and optionally continues to thumbnail hooks later

## UX Principles

- Help the user decide, not just scroll
- Prefer strategic differences over shallow rewrites
- Keep diagnostics lightweight and actionable
- Avoid fake certainty
- Make tradeoffs explicit

## Content Requirements

The product copy should:

- sound useful and confident without overselling
- explain title strategy in creator-friendly language
- avoid overly academic CTR jargon
- reinforce that the tool supports judgment, not perfect prediction

Helpful supporting content:

- "What makes a strong YouTube title?" guidance
- "Search-first vs curiosity-first" explanation
- "Why summary works and transcript works better" explanation

## Technical Design

### Route Structure

Recommended page route:

- `src/app/[locale]/(default)/youtube-title-generator/page.tsx`

Recommended API route:

- `src/app/api/youtube-title-generate/route.ts`

Recommended helper library:

- `src/app/api/youtube-title-generate/_lib.ts`

### API Input

```ts
type YoutubeTitleGenerateRequest = {
  videoTopic: string;
  targetAudience: string;
  summary: string;
  transcript?: string;
  titleLengthPreference?: "short" | "medium" | "flexible";
  optimizationPreference?: "search" | "balanced" | "clicks";
  avoidWords?: string[];
};
```

### API Output

```ts
type GeneratedYoutubeTitle = {
  title: string;
  angle:
    | "search-first"
    | "curiosity-first"
    | "outcome-first"
    | "contrarian-first";
  characterCount: number;
  truncationRisk: "low" | "medium" | "high";
  keywordPlacement: "front-loaded" | "mid-title" | "late" | "none";
  authenticityRisk: "low" | "medium" | "high";
  oneLineReason: string;
  bestUseCase: string;
};

type YoutubeTitleGenerateResponse = {
  titles: GeneratedYoutubeTitle[];
  recommendedTitle: string;
  recommendedReason: string;
  backupTitle: string;
};
```

### Generation Logic

The prompt should:

- generate grouped titles, not a flat list
- avoid bland corporate AI phrasing
- use the summary and transcript to stay content-faithful
- produce distinct strategic angles
- avoid overclaiming or empty clickbait

### Diagnostic Logic

The helper layer should infer:

- character count
- simple truncation risk heuristic
- whether likely keywords are front-loaded
- whether the title looks overly aggressive or misleading

These are heuristics and should be surfaced as such in the UI.

## Analytics

Track the following events:

- form submitted
- transcript used
- titles generated
- title saved to shortlist
- compare module opened
- final recommendation copied
- regenerate clicked

Key funnel questions:

- how many users submit with summary only
- how many submit with transcript
- how many save at least one title
- how many copy the final recommendation

## Success Metrics

Primary:

- form completion rate
- shortlist save rate
- final title copy rate

Secondary:

- transcript adoption rate
- regenerate rate
- compare engagement rate
- time from form submit to copy action

## Risks

### Product Risks

- outputs may feel generic if the prompt is weak
- too many titles may create more decision fatigue
- aggressive copy may damage trust if authenticity checks are weak

### UX Risks

- transcript input may feel too heavy if shown too early
- diagnostics may feel arbitrary if phrased too strongly
- grouped results may still overwhelm users if all cards are expanded at once

### Technical Risks

- transcript-based prompts may become too large or too slow
- model outputs may collapse into repetitive patterns without strong prompt structure
- authenticity and truncation heuristics may need iteration after real usage

## Future Phases

### Phase 2

- thumbnail hook generation
- rewrite actions like shorter / stronger / safer
- strategy filtering and favorite angle history

### Phase 3

- post-publish review mode
- title A/B candidate management
- personalized guidance from past video packaging performance

## Acceptance Criteria

- a user can complete the default form quickly without needing a transcript
- the API returns 12 titles grouped across 4 distinct angles
- each title includes diagnostics and explanation fields
- the UI supports saving up to 3 titles in a shortlist
- the compare module helps narrow a choice rather than showing raw clutter
- the product recommends one final title and one backup title with reasoning

## Recommendation

Build the MVP as a pre-publish title decision tool, not a generic title generator.

The first version should win on:

- strategic grouping
- creator-relevant diagnostics
- shortlist comparison
- final recommendation clarity

It should not try to win on:

- total title volume
- clickbait extremity
- full upload workflow coverage
