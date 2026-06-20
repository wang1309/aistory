# YouTube Name Generator Design

## Summary

This feature targets first-time YouTube creators who are blocked on naming their channel. The product should not behave like a generic name idea generator. It should help users move from "I need ideas" to "I can confidently launch with this name."

The recommended MVP is a naming decision tool with three strengths:

- Generate relevant channel names from lightweight structured input
- Explain and score names so users can compare them confidently
- Reduce launch risk with basic YouTube handle validation and shortlist comparison

## Problem

Most existing YouTube name generators are shallow SEO tools. They output lists of names but do not resolve the real decision blockers:

- Users do not know which naming style fits their channel
- Users worry that names are hard to remember, pronounce, or grow with
- Users do not know whether a name is usable as a YouTube handle
- Users become more anxious when presented with dozens of unranked options

The product opportunity is not better raw generation volume. The opportunity is better decision support.

## Target User

### Primary User

First-time YouTube creators who:

- are preparing to launch a new channel
- know their niche or rough topic area
- want a name that feels usable and durable, not just clever

### Explicitly Out of Scope for MVP

- established creators doing high-risk rebrands
- agencies managing many channels in parallel
- users needing legal-grade trademark review

## User Goals

Users want to:

- quickly get name ideas that match their niche and tone
- understand why a name is a good fit
- avoid obviously weak or unusable names
- compare a few strong candidates instead of scrolling a long list
- leave with one name they feel safe using

## Jobs To Be Done

- When I am starting a YouTube channel and do not know what to call it, help me find a name that fits my content and audience so I can launch without second-guessing it.
- When I have several possible names, help me compare them on memorability, pronounceability, and flexibility so I can choose one with confidence.
- When I pick a name, help me avoid basic handle conflicts and poor naming patterns so I do not regret it later.

## Product Positioning

### Positioning Statement

For first-time YouTube creators, this tool helps users find a channel name they can actually launch with, not just a list of random ideas.

### Product Promise

"From name ideas to launch-ready channel naming."

## Scope

### MVP Goals

- deliver a fast guided naming workflow
- produce grouped name candidates with explanations
- support shortlist comparison and one final recommendation
- provide basic YouTube-oriented availability guidance

### Non-Goals

- deep social platform availability guarantees
- live account registration workflows
- advanced legal or trademark validation
- full brand identity generation
- rename migration tooling for existing channels

## Functional Requirements

### 1. Guided Input Form

The input form should capture enough structure to improve results without creating friction.

Required fields:

- `niche`: what the channel is about
- `audience`: who the content is for
- `style`: one of brandable, searchable, hybrid, funny, personal, expert, or cinematic
- `lengthPreference`: short, medium, or flexible
- `pivotFlexibility`: whether the user wants room to expand into adjacent topics

Optional fields:

- `keywords`: words the user wants included or avoided
- `creatorName`: creator nickname or name, if relevant

### 2. Name Generation

The system should generate 20 to 30 candidates and group them into:

- `brandable`
- `searchable`
- `hybrid`

Each result must include:

- `name`
- `suggestedHandle`
- `category`
- `oneLineRationale`
- `scores`

### 3. Name Scoring

Each generated name must receive 4 visible scores on a simple 1-10 scale:

- `memorability`
- `pronounceability`
- `uniqueness`
- `pivotFlexibility`

These are guidance scores, not claims of objective truth. The UI should frame them as decision support.

### 4. Handle Guidance

The MVP must include basic YouTube-oriented handle guidance:

- validate handle format against obvious rule violations
- flag likely weak patterns such as excessive numbers or punctuation
- generate fallback handle variants when the ideal form is unavailable

The MVP should not promise guaranteed live availability unless that capability is implemented for real.

### 5. Shortlist Comparison

Users can save up to 3 candidates into a shortlist.

The compare view should show:

- the 4 scores side by side
- category
- rationale
- handle suggestion
- a concise "best for" label

### 6. Final Recommendation

After shortlist selection, the product should recommend one final name and explain:

- why it is strongest for the described channel
- what tradeoff the user is accepting
- what the next action should be

## Information Architecture

### Page Type

This should be a single landing-and-tool page consistent with the existing generator pages in the codebase.

### Page Sections

1. Hero
2. Guided input form
3. Generated results
4. Shortlist compare module
5. Final recommendation module
6. FAQ / trust / supporting content

### Hero

Purpose:

- explain the differentiation quickly
- set expectation that the tool helps decision-making, not just brainstorming

Recommended message:

- headline: "Find a YouTube channel name you can actually launch with"
- subheadline: "Generate name ideas, compare them, and choose a handle-friendly option with confidence."

Primary CTA:

- `Generate My Names`

### Guided Input Form

Purpose:

- reduce blank-page anxiety
- collect the minimum viable signal needed for stronger outputs

Recommended fields in order:

1. What is your channel about?
2. Who is it for?
3. What style fits you best?
4. How short should the name be?
5. Do you want room to pivot later?

### Results Area

Purpose:

- show structured output instead of a flat list
- help users orient immediately

Recommended behavior:

- default sort by strongest overall fit
- tabs or segmented controls for `brandable`, `searchable`, `hybrid`
- each card includes the name, handle, scores, rationale, and save action

### Shortlist Compare Area

Purpose:

- shift users from browsing to deciding

Recommended behavior:

- appears after the first shortlist item is saved
- encourages users to compare up to 3 names
- highlights best candidate for different priorities

### Final Recommendation Area

Purpose:

- close the loop
- reduce decision fatigue

Recommended output:

- one recommended name
- why it fits the user's brief
- one backup option
- next actions such as copy handle, save list, or generate channel description

## User Flow

1. User lands on the generator page
2. User enters niche, audience, style, length, and pivot preferences
3. User submits the form
4. System generates grouped name results
5. User reviews cards and saves 1 to 3 candidates
6. Compare view appears and helps the user narrow options
7. System recommends a final choice
8. User copies the chosen name and handle

## UX Principles

- Reduce fear, not just friction
- Prefer fewer stronger names over larger noisier lists
- Make tradeoffs explicit
- Avoid false certainty on availability
- Treat the shortlist as the core decision surface

## Content Requirements

The product copy should:

- sound confident but not overclaim
- explain differences between naming styles
- use beginner-friendly language
- avoid technical jargon where possible

Helpful supporting content:

- "brandable vs searchable" explanation
- "what makes a good YouTube name" guidance
- "why your handle may differ from your channel name" explanation

## Technical Design

### Route Structure

Recommended page route:

- `src/app/[locale]/(default)/youtube-name-generator/page.tsx`

Recommended API route:

- `src/app/api/youtube-name-generate/route.ts`

If the team wants naming consistency with existing routes, a helper library can live at:

- `src/app/api/youtube-name-generate/_lib.ts`

### API Input

```ts
type YoutubeNameGenerateRequest = {
  niche: string;
  audience: string;
  style:
    | "brandable"
    | "searchable"
    | "hybrid"
    | "funny"
    | "personal"
    | "expert"
    | "cinematic";
  lengthPreference: "short" | "medium" | "flexible";
  pivotFlexibility: "low" | "medium" | "high";
  keywords?: string[];
  creatorName?: string;
};
```

### API Output

```ts
type GeneratedYoutubeName = {
  name: string;
  suggestedHandle: string;
  category: "brandable" | "searchable" | "hybrid";
  oneLineRationale: string;
  bestFor: string;
  scores: {
    memorability: number;
    pronounceability: number;
    uniqueness: number;
    pivotFlexibility: number;
  };
  handleValidation: {
    formatValid: boolean;
    warnings: string[];
    fallbackHandles: string[];
  };
};

type YoutubeNameGenerateResponse = {
  names: GeneratedYoutubeName[];
  recommendedName: string;
  recommendedReason: string;
};
```

### Generation Logic

The underlying model prompt should:

- produce grouped candidates, not one undifferentiated list
- avoid gibberish or awkward compounds
- prefer pronounceable names
- include handle-safe suggestions
- explain each candidate in plain language

### Availability Logic

For MVP:

- validate format locally
- generate normalized handle variants
- optionally check simple search-based collision heuristics later

The UI must say "handle-friendly" or "basic validation passed" unless true live availability checks exist.

## Analytics

Track the following events:

- form submitted
- results generated
- candidate saved to shortlist
- compare view opened
- final recommendation copied
- regenerate clicked

Key funnel questions:

- how many users submit the form
- how many save at least one result
- how many save 3 results
- how many copy a final recommendation

## Success Metrics

Primary:

- strong form completion rate
- shortlist save rate
- copy or export rate from final recommendation

Secondary:

- regenerate rate
- compare engagement rate
- time from first input to final copy action

## Risks

### Product Risks

- results may feel generic if the prompt design is weak
- availability messaging may damage trust if it overpromises
- too many weak results will increase, not reduce, user anxiety

### UX Risks

- form can become too heavy if more fields are added too early
- score explanations can feel arbitrary if not phrased carefully
- compare view may be ignored if it is visually subordinate

### Technical Risks

- model output quality may vary too much without strong constraints
- real handle availability checks are more complex than MVP messaging suggests

## Future Phases

### Phase 2

- cross-platform handle checks
- domain suggestions
- channel description generation from selected name
- logo and banner generation tie-ins

### Phase 3

- rename mode for existing channels
- saved naming projects
- collaboration or team review workflows

## Acceptance Criteria

- a user can complete the form in under 30 seconds
- the API returns grouped and scored name results
- each result includes a rationale and handle suggestion
- users can save up to 3 names to a shortlist
- the compare module displays shortlist candidates side by side
- the product produces one final recommendation with reasoning
- availability messaging does not claim guaranteed live handle availability

## Recommendation

Build the MVP as a decision-support generator, not a plain list generator.

The first version should win on:

- structure
- explanation
- comparison
- launch confidence

It should not try to win on:

- number of names
- legal certainty
- full creator branding coverage
