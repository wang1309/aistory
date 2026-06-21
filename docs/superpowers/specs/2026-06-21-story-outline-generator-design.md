# Story Outline Generator Design

> **Status:** Drafted from competitive research, community pain-point review, and user-approved product-direction decisions on 2026-06-21.

## Summary

Build a new standalone `/story-outline-generator` tool that helps new and idea-led writers turn a vague story concept into a structured outline they can actually write, then pushes them into a paid `chapter expansion` step. The page should not behave like a generic one-shot outline generator. It should act as a low-friction entry point into deeper story development and credits consumption.

The MVP should follow the existing single-page generator pattern already used across this codebase. It should prioritize fast time-to-value, strong perceived usefulness in the free result, and a clear next step that makes users want to expand the outline into chapters or scenes.

## Product Decision

The approved direction is:

- start as a lightweight SEO-friendly generator page
- optimize for registration and paid expansion, not just traffic or novelty
- target new writers and inspiration-led users first
- treat `expand into chapters` as the primary monetizable action

This means the product is not just `Story Outline Generator` in practice. It is a conversion-oriented `outline-to-expansion` funnel.

## Problem

New writers often have a premise, a character, or a mood, but they do not know how to convert that idea into a workable story structure. Existing tools split into two unsatisfying extremes:

- shallow generators that return generic or disposable outline text
- heavyweight writing workspaces that ask for too much setup before users see value

Users do not only need "more ideas." They need enough structure to feel like the story has become writable, without being forced into a complex planning workflow.

## Research Inputs

### Competitive Landscape

The feature competes with at least three product categories:

1. AI co-writing tools such as Sudowrite, NovelCrafter, Squibler, and NovelAI
2. structured writing platforms such as Plottr, Dabble, LivingWriter, Campfire, and Plot Factory
3. free utility-style generators such as Reedsy Plot Generator, GravityWrite, and ToolBaz

The market is already crowded with one-click generators. Products that successfully monetize usually do so by selling deeper structure, memory, organization, and continuation workflows rather than the first generated artifact itself.

### Community Pain Points

From Reddit and adjacent writing communities, the repeated pain points are:

- users want structure, but not so much structure that the fun disappears
- users lose track of characters, beats, and chronology as stories grow
- many AI tools fail to remember prior setup or follow the outline consistently
- advanced tools can feel intimidating because of setup complexity
- credit-based pricing creates hesitation if the next step does not feel clearly worth paying for

### Implication

The MVP should not try to solve long-form writing management. It should prove a narrower claim:

`If we give new writers a strong first outline, a meaningful share of them will pay to expand it into a more executable chapter plan.`

## Target User

### Primary User

New and inspiration-led writers who:

- arrive with a vague story seed, not a complete plan
- want to start quickly
- do not want to fill a large form
- are willing to pay if the tool clearly helps them continue writing

### Secondary Users

- hobby fiction writers exploring prompts and ideas
- fanfic or genre writers who want a fast structure seed
- returning users who later move into deeper story tools

### Explicitly Not the MVP Primary User

- power users who need full story bible management
- professional long-form writers who expect timeline systems, relationship graphs, or advanced structure frameworks on day one

## Goal

Move users from:

`I have a vague story idea`

to:

`I have a structured outline, and I want to pay to expand it into chapters`

## Non-Goals

The MVP will not:

- build a full writing workspace
- generate an entire novel draft
- ship a full story bible editor
- support complex collaboration or series management
- provide advanced template switching across every major plotting method
- solve long-term consistency checking between outline and manuscript

## Product Positioning

Externally, the page can target the keyword space around `story outline generator`.

Internally, the product should be positioned as:

`a low-friction story outlining entry point with a paid expansion path`

This distinction matters because the product is not trying to win purely on "number of outlines generated." It is trying to convert users into deeper structured story generation.

## User Journey

The intended MVP flow is:

1. user lands on `/story-outline-generator`
2. user enters a one-sentence story idea
3. user optionally selects a few lightweight story preferences
4. user generates a structured outline
5. user reviews the result and feels the story is now directionally viable
6. user sees that chapter-level detail is still missing
7. user clicks `Expand into Chapters`
8. user is asked to log in or spend credits
9. user receives a detailed chapter plan
10. user is then eligible for later scene-level continuation or deeper story tools

## Information Architecture

The page should follow the existing generator-page pattern in this repo:

1. Hero and generator
2. Result area with strong next-step CTA
3. Intro and explanatory content
4. Use cases / benefits
5. FAQ
6. Related tools / internal linking

This keeps implementation consistent with the current site architecture and preserves SEO value.

## Core Experience

### Inputs

The form must stay lightweight. Recommended fields:

- `Story idea` - required free-text field
- `Genre` - optional selection
- `Tone` - optional selection
- `Target length` - optional selection
- `Audience` - optional selection

The form should not require deep worldbuilding or large parameter sets in MVP.

### Free Output

The free result should be structured, useful, and incomplete in the right way. Recommended sections:

- `Premise`
- `Core conflict`
- `Story arc`
- `Key beats`

The result should feel immediately usable as a writing direction, while clearly lacking execution detail such as chapters and scenes.

### Paid Expansion

The main paid action is:

- `Expand into Chapters`

This should turn the outline into a more actionable chapter plan, such as:

- chapter-by-chapter progression
- each chapter's narrative purpose
- core turning points or escalation

Scene-level expansion can exist as a follow-on or early P1 capability, but it should not replace chapter expansion as the MVP's main conversion target.

## Free vs Paid Boundary

### Free Tier

Free should include:

- one high-quality structured outline
- limited regeneration
- enough detail to prove value

### Paid Tier

Paid should include:

- chapter expansion
- optional scene expansion after chapter generation
- additional alternate outline directions
- save-and-continue value where appropriate

The free output must not already satisfy the chapter-planning need. Otherwise the conversion path collapses.

## Success Criteria

### Product Goal

The MVP succeeds if users perceive enough value in the initial outline that a meaningful share of them choose to continue into paid expansion.

### North Star

`Outline-to-Expansion Conversion Rate`

Among users who generate an outline, how many proceed into chapter expansion.

### Supporting Metrics

Acquisition and activation:

- landing page visitor to generator start rate
- generator start to successful generation rate

Value perception:

- result engagement time
- copy rate
- regenerate rate
- click rate on `Expand into Chapters`

Conversion:

- click-to-login conversion rate
- login-to-first-credit-spend conversion rate
- chapter expansion completion rate

## Scope

### P0

Must ship in MVP:

- lightweight input form
- structured outline output
- strong result quality controls
- explicit `Expand into Chapters` CTA
- chapter expansion flow
- login or credits gating on expansion
- SEO-supporting landing content and metadata

### P1

Should follow soon after if MVP signals are positive:

- regenerate with different angle
- scene expansion after chapters
- copy/save result helpers
- suggested next-step links into related tools
- basic recent-result history

### P2

Do not include in MVP:

- worldbuilding database
- advanced story bible
- relationship graph
- timeline editor
- collaboration tools
- series management
- advanced structure framework switching
- automatic manuscript-outline sync

## Risks

### Risk 1: Free output is too weak

Users do not see enough value to continue.

### Risk 2: Free output is too complete

Users copy the result and leave without paying for expansion.

### Risk 3: Output feels generic

The result reads like padded template text instead of a workable story structure.

### Risk 4: Monetization feels abrupt

If the CTA feels like a hard paywall instead of a natural continuation step, users will bounce.

### Risk 5: Product chain disconnect

If chapter expansion does not lead naturally into the site's broader story tools, the business value of the page is capped.

## Experiments

The MVP should be launched with clear experiment hooks where feasible.

### Experiment 1: Free output depth

- A: shorter beat list
- B: slightly richer beat list and conflict framing

Measure expansion CTA click-through.

### Experiment 2: CTA wording

- A: `Expand into Chapters`
- B: `Turn This Outline into an 8-Chapter Plan`

Measure click-through and downstream spend.

### Experiment 3: Login timing

- A: free outline before login, gate at expansion
- B: login required before first generation

Expected recommendation: A should perform better for top-of-funnel conversion.

## Recommended Product Copy Direction

The page should emphasize:

- speed to first useful structure
- low-friction outlining
- the bridge from idea to actual writing

It should avoid sounding like:

- a generic AI text toy
- a professional planning suite for power users
- a full book generator

## Acceptance Criteria

The MVP is ready when:

- `/story-outline-generator` exists as a standalone tool page
- a new user can generate an outline from a lightweight prompt
- the result is structured into clear outline sections
- the result prominently offers chapter expansion
- chapter expansion is connected to login or credits flow
- the page includes standard SEO and supporting sections consistent with the site's generator pattern
- the experience clearly supports the funnel from free outline to paid continuation

## Recommendation

Ship this as a focused `entry-point generator with a paid expansion path`, not as a full writing product. If early users respond well to expansion, the next layer of investment should go into chapter quality, scene expansion, and saved continuation flows before any heavy workspace features.
