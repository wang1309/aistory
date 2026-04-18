# Fantasy Generator Sections Design

## Summary

This change fills the missing landing-page sections on `/fantasy-generator` while preserving the existing hero/generator experience. The page will follow the same information architecture already used across other generator pages in the site, so the implementation stays low-risk and consistent with established SEO and content patterns.

## Goals

- Keep the existing `FantasyGenerate` hero/generator as the first screen.
- Add the missing supporting sections expected on tool landing pages.
- Reuse existing shared block components instead of creating new UI.
- Add complete localized copy for all currently supported fantasy page locales.
- Keep the page structure and data model aligned with similar generator pages.

## Non-Goals

- No redesign of the `FantasyGenerate` hero/generator component.
- No new fantasy-specific section component.
- No schema changes to shared section component props.
- No changes to the fantasy generation API or interaction logic.

## User Problem

`/fantasy-generator` currently exposes the generator hero, tool hub, and CTA only. Compared with other generator pages, it lacks explanatory and SEO-supporting sections that help users understand what the tool does, why they should use it, and what use cases it supports.

## Existing Context

The page currently renders:

- `FantasyGenerate`
- `ModuleToolsSection`
- `CTA`

Comparable pages generally render:

- hero/generator
- `Feature1` for overview / “what it is”
- `Feature2` for benefits / “why use it”
- `Feature` or `Feature3` for applications / usage scenarios
- `FAQ`
- `ModuleToolsSection`
- `CTA`

## Proposed Page Structure

The final page order will be:

1. `FantasyGenerate`
2. `Feature1` using `feature_intro`
3. `Feature2` using `feature_benefits`
4. `Feature` using `feature_section`
5. `FAQ` using `faq_section`
6. `ModuleToolsSection`
7. `CTA`

This matches the standard tool landing-page flow already used by `story-prompt-generator`, `backstory-generator`, and `book-title-generator`.

## Data Model

No new block schema will be introduced. The fantasy page locale files will be extended with these keys:

- `feature_intro`
- `feature_benefits`
- `feature_section`
- `faq_section`

The existing `cta` object remains in place and will continue to feed the shared `CTA` block.

Each new section will use the same shape already consumed by the shared block components:

- section metadata: `name`, `label`, `title`, `description`
- content arrays in `items`
- optional `image` on `Feature1`
- per-item `icon`
- per-item `image` on `Feature2`

## Content Direction

### Feature Intro

Purpose: explain what the fantasy generator is and what makes it useful immediately.

Content themes:

- turns rough ideas into fantasy stories fast
- supports both quick generation and guided worldbuilding
- helps users build worlds, characters, and plot momentum together

### Feature Benefits

Purpose: explain why users should choose this tool.

Content themes:

- broad fantasy subgenre coverage
- structured worldbuilding inputs for stronger output
- adjustable tone, audience, length, and perspective

### Applications

Purpose: show who this tool is for.

Use case groups:

- fiction and web novel writers
- TRPG / game narrative designers
- content creators and roleplay communities

### FAQ

Purpose: answer high-intent questions before users bounce.

Expected questions:

- what kinds of fantasy stories can it generate
- whether users can control worldbuilding details
- whether outputs can be used as drafts or outlines
- whether multiple languages are supported

## Localization Scope

The following locale files will be updated:

- `src/i18n/pages/fantasy/en.json`
- `src/i18n/pages/fantasy/zh.json`
- `src/i18n/pages/fantasy/de.json`
- `src/i18n/pages/fantasy/ja.json`
- `src/i18n/pages/fantasy/ko.json`

Metadata and existing hero copy stay unchanged unless a structural dependency requires a small alignment edit.

## Implementation Plan

### Page Assembly

Update `src/app/[locale]/(default)/fantasy-generator/page.tsx` to:

- import `Feature1`, `Feature2`, `Feature`, and `FAQ`
- read the new section keys from the fantasy locale payload
- render those sections conditionally between `FantasyGenerate` and `ModuleToolsSection`

### Locale Content

Extend each fantasy locale JSON file with the new sections using the shared schema expected by the block components.

### Safety

Use conditional rendering for each new section so incomplete locale payloads cannot crash the page during development.

## Testing And Verification

- Run `pnpm lint`
- Load `/fantasy-generator` and verify the new sections render in the expected order
- Confirm the page still excludes `fantasy-generator` from `ModuleToolsSection`
- Confirm existing metadata and breadcrumb schema remain intact

## Risks

### Content Consistency

Risk: multi-locale copy may drift in tone or structure.

Mitigation: use the same section layout and parallel meaning across all locales.

### Component Expectations

Risk: shared blocks expect fields that are missing in fantasy locale files.

Mitigation: follow the exact field structure already used by other pages and keep rendering conditional.

## Acceptance Criteria

- `/fantasy-generator` keeps its current hero/generator at the top.
- The page gains overview, benefits, applications, and FAQ sections.
- All new sections use existing shared block components.
- All fantasy locale files include the new content keys.
- The page renders without lint errors from the new changes.
