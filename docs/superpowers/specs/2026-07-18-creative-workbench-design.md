# Creative Workbench Design

## Goal

Turn Aistory from a collection of independent AI generators into a coherent creative product that serves both first-time users seeking a fast draft and returning writers managing long-running work. The product must feel professionally dependable while making the growth of a story, its characters, and its world enjoyable to explore.

## First Principles

- A user visits to make progress on a piece of writing, not to inspect an AI interface. The next meaningful action must be obvious and low-effort.
- Creative output has compounding value only when it can be continued, edited, saved, and reused. Generated text must not terminate in a dead-end result pane.
- New users need a short path to a credible first draft. Experienced users need control, durable context, and a clear mental model of where their assets live.
- Professionalism comes from predictable structure, consistent controls, legible states, and calm visual hierarchy. Playfulness comes from meaningful creative discovery and visible work progress, not decorative motion or reward mechanics.

## Product Architecture

The product has a public acquisition layer and an authenticated creative layer. The public homepage is not the workbench: it explains the product and offers a fast inspiration entry. The workbench is where work is created, resumed, organized, and connected to the editor.

| Area | Purpose | Primary route |
| --- | --- | --- |
| Homepage | Brand, product discovery, one-input quick start | `/` |
| Tools | Browse specialized generators by creative goal | `/tools` |
| Studio | Resume work, create a project, browse recent work | `/studio` |
| Project | Understand one work across overview, outline, characters, world, and versions | `/studio/[workId]` |
| AI Writing Editor | Immersive prose editing and in-context AI assistance | `/ai-write/editor` |
| Library | Reusable characters, world facts, templates, and excerpts | `/library` |

`/ai-write/editor` remains the focused document editor. Studio must not reproduce its rich-text controls. Studio manages the project and its contextual assets; the editor changes the prose.

## Dual-Speed Creative Flow

### Quick Start

The first-time flow has one required input: the user's idea. Genre, length, tone, language, and model begin with recommended defaults and remain available through an expandable controls section.

```text
Idea -> recommended preset -> generate first draft -> edit, save, or branch
```

The first result offers exactly four meaningful continuations:

- Continue writing: open the result in the AI Writing Editor.
- Save as work: create or attach a Studio project.
- Extract as asset: save a character, world fact, excerpt, or template to Library.
- Try a variant: regenerate with one explicitly selected change, such as point of view, tone, or ending.

### Project Flow

Returning writers enter a project and see its current stage, primary document, related assets, and latest version. Projects expose the sections `Overview`, `Draft`, `Outline`, `Characters`, `World`, and `Versions`. The draft section opens the existing editor rather than embedding another editor.

```text
Open project -> select current chapter/context -> edit or generate -> autosave -> version and assets update
```

## Generator Interaction Model

All existing generator blocks converge on a three-part structure:

1. Intent: the required creative brief.
2. Controls: optional genre, length, voice, model, language, and advanced parameters.
3. Result: readable output plus the four continuation actions.

During generation, the interface shows task state, not ambient effects:

```text
Preparing context -> shaping conflict -> completing draft
```

The user can cancel while generating. A failed request preserves its input and returns a concrete next action. Quota, sign-in, and credit states retain their existing business rules but use a shared presentation.

## Visual System

### Visual Direction

The working scene is a calm writing desk: a warm-neutral content surface for reading and writing, separated from a slightly cooler navigation and utility layer. A single amber accent identifies primary actions, selected items, and meaningful progress. Accent color is never used as decoration across inactive controls.

### Tokens

- Surface: warm paper-neutral page and content backgrounds; no pure black or white.
- Utility layer: subtly cooler sidebar, toolbar, and panel surface.
- Text: dark ink primary text, muted warm-gray supporting text.
- Semantics: success, warning, destructive, and info receive separate token pairs and never borrow the brand accent.
- Radius: `6px` for compact controls, `8px` for standard controls, and `12px` for large framed work surfaces and cover art.
- Elevation: no shadow for ordinary content; light shadow for menus and drawers; medium shadow for modal dialogs only.
- Typography: sans-serif for navigation, controls, metadata, and data; readable serif for long-form draft content only.

### Motion

Motion is limited to 150-250ms state changes, progressive reveals, and loading feedback. Remove ongoing visual effects from product work surfaces, including large gradients, glass blur used as decoration, floating cards, ambient glow, and unrelated hover animation. All movement respects `prefers-reduced-motion`.

## Information Layout

Desktop Studio maintains stable navigation, a central project area, and a contextual utility panel when space permits:

```text
+--------------------------------------------------------------------------------+
| AISTORY | Studio | Works | Library                              Search Account |
+----------+-------------------------------------------+-------------------------+
| Recent   | Project title                              | Context                 |
| New work | Overview Draft Outline Characters World    | Characters              |
| Works    |                                           | World facts             |
| Library  | Current stage and work preview             | Latest version          |
|          | [Open editor] [Generate next passage]     | [Manage assets]         |
+----------+-------------------------------------------+-------------------------+
```

On mobile, the primary navigation is `Create`, `Works`, and `Library`. Project sections and context move into a bottom sheet or a drawer. The editor remains a dedicated screen.

## Meaningful Playfulness

Creative engagement is grounded in the work:

- Discovery: theme prompts, template combinations, and saved inspiration collections.
- Accumulation: characters, world facts, passages, chapters, and versions make a visible creative universe.
- Feedback: a small acknowledgment only after meaningful work, such as a completed chapter, a first saved character, or successful asset reuse.

The product does not use daily streak pressure, virtual currency, empty badges, or celebration overlays for routine clicks.

## Error, Empty, and Persistence States

- No works: offer one clear quick-start action and one template option.
- No assets: explain that generated characters, settings, and excerpts can be saved here after generation.
- Generation failed: retain the exact input, state whether credits were consumed, and expose retry.
- Save state: show `Saving`, `Saved`, or `Could not save` adjacent to the relevant work title. The failure state has a retry action and never implies a save succeeded.
- Loading: use structural skeletons where a section is being fetched; use compact progress feedback only for an action the user just triggered.

## Implementation Boundaries

### P0: Visual Foundation

- Consolidate color, spacing, radius, elevation, focus, and motion tokens in `src/app/theme.css`.
- Remove unused or conflicting decorative utility rules from `src/app/globals.css`.
- Define shared product variants for button, input, tabs, tags, status feedback, empty states, and loading skeletons under `src/components/ui`.
- Apply the system first to global header, dashboard sidebar, and one representative generator. No route or data model changes occur in P0.

### P1: Unified Creation Path

- Refactor `src/components/blocks/story-generate/index.tsx` as the reference implementation of intent, optional controls, and result continuation actions.
- Extract the shared visual and interaction layer for other generator blocks without changing their existing API contracts.
- Add a stable handoff contract between a generator result and `/ai-write/editor`: source, project identifier when available, initial text, language, and originating generator.
- Show editor save state, associated project when available, and a route back to Studio without changing the editor's document-authoring responsibilities.

### P2: Studio and Library

- Build the minimum Studio first: recent works, create work, open work in editor, and project metadata.
- Add Library asset types and explicit attach/extract flows after work persistence is stable.
- Add project context sections, versions, and cross-tool continuation only after their storage and ownership model is defined.

## Data Flow

```text
Generator input
  -> existing generation API
  -> result state
  -> editor handoff OR work save OR library extraction
  -> work/project persistence
  -> Studio and Library reflect the updated state
```

The server remains authoritative for generation, quota, credits, saved work, and asset ownership. Client storage may preserve drafts and immediate UI state but must not represent a confirmed save or authorization decision.

## Verification

- Visual regression coverage for light and dark themes at desktop and mobile widths.
- Keyboard traversal, focus visibility, color contrast, and reduced-motion checks for all shared components.
- Happy-path Playwright coverage: quick start to result, result to editor, save/open a work, and editor return to project.
- Validation coverage for failed generation, failed save, unauthenticated save, exhausted quota, and insufficient credits.
- Product metrics: time to first generation, generation-to-editor or generation-to-save conversion, and seven-day return-to-work rate.

## Non-Goals

- Do not replace the existing AI Writing Editor with Studio.
- Do not redesign every specialized generator before establishing the shared foundation.
- Do not add gamification that is disconnected from completing or reusing creative work.
- Do not change AI model, payment, authentication, quota, or generation API behavior as part of visual P0 work.
