# OC Generator Design

**Date:** 2026-07-19

**Status:** Design approved in conversation; pending written-spec review

## Goal

Build a writing-first `OC generator` that turns a character idea into three concepts, a reusable structured character profile, a visual prompt, and a handoff into the existing Backstory, Story, and D&D generators.

The first release is a validation MVP. It does not generate images, require login, save characters to the database, or provide cross-device synchronization.

## Product Decisions

- The product is writing-first rather than a visual OC maker.
- Visitors can generate without logging in.
- Current drafts and saved characters live in browser storage.
- The first release supports General Writer, RPG/D&D, and Anime/Fandom modes.
- The result can be continued in the existing Backstory, Story, and D&D tools.
- Database persistence, account-linked characters, image generation, sharing, and community features are out of scope.

## User Flow

```text
/oc-generator
  -> choose mode and enter a few constraints
  -> generate three short concepts
  -> select one concept
  -> generate a full profile
  -> lock fields and reroll individual fields
  -> save locally, copy, or export
  -> continue to Backstory, Story, or D&D
```

### Input

The initial form has four core inputs:

- `mode`: `general`, `rpg`, or `anime`
- `world`: a setting, genre, or fandom style
- `role`: such as hero, villain, NPC, or romantic lead
- `constraints`: free-form requirements

The form also sends the current locale. The form should not become a long attribute questionnaire. Users are looking for help creating a character, so the system should infer most details and expose controls after a concept is selected.

### Concept Selection

The first generation returns exactly three concise concepts. Each concept contains:

- `id`
- `name`
- `premise`
- `visualHook`
- `personalityHook`
- `conflictHook`

The user selects one concept before the full profile is generated. The concept stage should remain lightweight and scannable; detailed field editing happens only after selection.

### Profile Editing

The selected concept is expanded into an `OcProfile` with:

- identity: name, aliases, age, pronouns, role, species
- appearance
- personality
- desire
- flaw
- secret
- relationships
- conflict
- story hooks
- visual prompt

Every rerollable field has a lock state. A reroll request must preserve all locked fields and return only the requested unlocked field or fields. The UI must make it clear that saving a version is local to the current browser.

## Architecture

### Page and Components

Follow the existing locale-aware generator page pattern:

```text
src/app/[locale]/(default)/oc-generator/page.tsx
  metadata, JSON-LD, translations, related tools

src/components/blocks/oc-generate/index.tsx
  client-side workbench state and orchestration

src/components/blocks/oc-generate/
  mode-selector.tsx
  oc-input-form.tsx
  concept-card.tsx
  oc-profile.tsx
  oc-field-row.tsx
  oc-history-drawer.tsx
  oc-export-actions.tsx

src/lib/oc-schema.ts
  shared types and request/response validation

src/lib/oc-storage.ts
  localStorage draft, character, and version operations

src/lib/oc-handoff.ts
  versioned sessionStorage payload for downstream generators

src/app/api/oc-generate/route.ts
  request validation, Turnstile, quota, model call, response validation
```

The page uses the same metadata, `next-intl`, `RelatedTools`, quota hint, paywall, Turnstile, and activation tracking conventions already used by existing generators.

### Layout and States

Desktop uses an input panel and a result panel. Mobile stacks the input above the result. The result area must reserve stable space for loading and error states so controls do not shift during generation.

The workbench has five states:

1. `idle`: input form, examples, and generate action.
2. `generating-concepts`: input remains visible and result shows a loading skeleton.
3. `concept-selection`: three concept cards with one selection action each.
4. `profile-ready`: structured profile, lock controls, reroll actions, save, copy, export, and continuation actions.
5. `error/paywall`: existing error and quota/paywall patterns.

The interface should be fully usable without JavaScript-only navigation assumptions. Buttons need accessible labels, locked state needs a text alternative, and all copy/error text must be localized.

## Generation Contract

```ts
type OcMode = "general" | "rpg" | "anime";

type OcGenerationOperation = "concepts" | "profile" | "reroll";

type OcInput = {
  mode: OcMode;
  world: string;
  role: string;
  constraints: string;
  locale: string;
};

type OcConcept = {
  id: string;
  name: string;
  premise: string;
  visualHook: string;
  personalityHook: string;
  conflictHook: string;
};

type OcProfile = {
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
```

Add `POST /api/oc-generate` with a discriminated request:

- `operation: "concepts"` receives `OcInput` and returns three `OcConcept` values.
- `operation: "profile"` receives `OcInput` plus the selected concept and returns one `OcProfile`.
- `operation: "reroll"` receives the current profile, requested field names, and locked field names and returns only the changed fields.

The server must whitelist operations, modes, fields, model keys, and input lengths. Model output is parsed and validated before it reaches the client. Invalid JSON may be repaired or retried once. A failed validation or model request must return an explicit error and must not charge credits.

## Quota and Security

Use the existing creative quota flow with a new `oc-generator` page key:

```text
validate request
  -> verify Turnstile
  -> prepareCreativeQuota({ pageKey: "oc-generator" })
  -> call the configured model
  -> validate structured output
  -> commit charge only after success
```

Each successful `concepts`, `profile`, or `reroll` request is one generation request. The first release uses the standard structured-output-capable model and does not expose multiple model tiers.

Use existing content filtering and rate limiting. Do not include full character text in analytics events. Save routes are not needed because local persistence is client-side.

## Browser Storage

Use a dedicated `src/lib/oc-storage.ts` rather than writing storage calls inside the workbench component.

```ts
type StoredOcVersion = {
  id: string;
  profile: OcProfile;
  visualPrompt: string;
  lockedFields: string[];
  createdAt: string;
};

type StoredOcCharacter = {
  id: string;
  name: string;
  mode: OcMode;
  versions: StoredOcVersion[];
  createdAt: string;
  updatedAt: string;
};
```

Storage rules:

- Draft key: `oc-generator:draft:v1`.
- Character list key: `oc-generator:characters:v1`.
- Save the draft automatically after meaningful state changes.
- Keep at most 20 characters and the newest 10 versions per character.
- Support list, read, save, delete, restore version, and clear operations.
- Invalid or corrupted JSON must be ignored and replaced with an empty safe state.
- Export as Markdown and JSON so users can take characters out of the browser.
- Display that storage is local to this browser; do not imply account sync.

No database schema, migration, save API, login gate, or auth-resume flow is part of this release.

## Downstream Handoff

Do not put the full profile in the URL. Use a versioned session payload:

```ts
type OcHandoffPayload = {
  version: 1;
  source: "oc-generator";
  profile: OcProfile;
  visualPrompt: string;
};
```

The OC page writes the payload to session storage before navigating. The target generator reads it, converts it to its existing prompt input, and leaves its own generation, quota, and save behavior unchanged. The handoff must fail gracefully if the payload is missing, expired, malformed, or from an unsupported version.

## Analytics

Use existing OpenPanel and activation funnel conventions for:

- `oc_generation_started`
- `oc_concepts_generated`
- `oc_concept_selected`
- `oc_field_rerolled`
- `oc_profile_copied`
- `oc_character_saved_local`
- `oc_character_exported`
- `oc_continue_backstory`
- `oc_continue_story`
- `oc_continue_dnd`
- `oc_generation_failed`

Record mode, operation, field name, and result status only. Do not send full prompts or generated profile text to analytics.

## Testing

### Unit and API Tests

- Validate operation, mode, required fields, length limits, and reroll field names.
- Parse valid concept/profile output.
- Reject malformed model output after the retry path.
- Confirm failed validation, Turnstile, and model requests do not charge quota.
- Confirm successful generation charges once.
- Confirm locked fields are preserved during reroll.

### Browser Storage Tests

- Restore and autosave a draft.
- Save, list, update, delete, and restore a local character version.
- Enforce the character and version limits.
- Recover from malformed localStorage values.
- Export Markdown and JSON with the expected profile fields.

### Playwright Flow

Cover the anonymous happy path:

```text
open OC page
  -> fill mode/world/role/constraints
  -> mock /api/oc-generate concepts response
  -> select a concept
  -> mock profile response
  -> lock one field and reroll another
  -> save locally
  -> continue to Backstory and verify handoff payload
```

Also cover an API validation failure and an exhausted quota response. AI calls must be mocked for deterministic tests.

## Success Criteria

The MVP is ready for traffic when:

- anonymous visitors can complete the full flow without an account;
- structured output renders without manual parsing failures in the happy path;
- local drafts and saved versions survive refresh;
- locked fields remain stable during rerolls;
- Backstory, Story, and D&D receive the profile context;
- quota is charged only for successful generation requests;
- all core UI states are localized and responsive;
- analytics can measure generation, refinement, export, and downstream continuation.

The product decision after launch is based on behavior rather than page views: prioritize continued editing, local saves/exports, downstream story starts, and repeat use. Do not add image generation until those signals outperform the existing generic generation-page baseline.

## Out of Scope

- AI image generation and reference-sheet rendering
- database persistence and cross-device sync
- account-linked character libraries
- public sharing, gallery, remix, and community moderation
- fandom-specific programmatic page expansion
- relationship graphs and collaborative editing
- video, 4K export, pose control, or custom model infrastructure
