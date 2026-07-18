# Editorial Writing Surface Design

## Context

Story Generator serves professional and independent fiction writers, fan-fiction and web-fiction writers, and marketing content creators. The acquisition path starts with anonymous, low-friction generation. The product must then convert successful first drafts into repeat writing, saved projects, and paid retention.

## Goal

Reframe the public site as a calm, credible writing space rather than a generic collection of AI utilities. Preserve all existing generation, authentication, payment, data, and routing behavior.

## Design Direction

- Register: product UI with a brand-led acquisition surface.
- Personality: quiet, literary, reliable.
- Default scene: an author beginning a draft in daylight, reading and revising for an extended session.
- Default theme: warm paper. Dark mode remains available as warm charcoal for low-light writing.
- Color strategy: restrained, using warm neutrals and one clay-orange action accent.

## Homepage

The hero becomes an input-led acquisition surface:

1. Lead with a concise literary value proposition and a visible story prompt field.
2. Reuse existing quick-start behavior to move users into the complete generator without changing generation logic.
3. Replace the animated book-cover cascade with a static manuscript preview that reads as a work in progress.
4. Use content-driven hero height so the generator affordance and the next section remain discoverable on mobile.
5. Keep the long-form marketing content and tool directory, but reduce their visual priority relative to starting a draft.

## Generator

The generator becomes a writing surface with progressive disclosure:

1. Prompt input is the visual primary action.
2. Model choices use a compact segmented control instead of three equal cards.
3. Existing advanced fields, history, presets, output, quota, shortcuts, and localization remain functional but move to secondary hierarchy.
4. Desktop metadata may remain as subdued supporting text. Mobile suppresses nonessential metadata and preserves the primary generate action.
5. Cards use a single surface. Nested bezels and decorative shadows are removed.

## Shared Visual System

- Light background: tinted paper, never pure white.
- Foreground: warm ink, never pure black.
- Accent: one clay-orange action color. Status colors retain semantic meaning only.
- Dark background: warm charcoal rather than blue-purple.
- Radius scale: 4px, 8px, 12px. Pills are reserved for tags, filters, and compact status labels.
- Typography: Source Serif 4 carries literary headings and manuscript moments; DM Sans carries controls and navigation; Chinese display copy uses an appropriate serif fallback.
- Eliminate gradient text, ambient orb backgrounds, decorative blur, duplicate borders, and non-semantic color variation.
- Motion is limited to state feedback and short transform/opacity entrances. Content is visible before client animation enhancement.

## Responsive and Accessibility Requirements

- Validate at desktop and 390px widths.
- No horizontal overflow or clipped tool labels.
- No floating action overlaps with the main prompt, model selector, or generate button.
- Preserve an immediately visible primary action on mobile.
- Increase subdued text to a readable contrast level; do not encode model or quota state by color alone.
- Honor reduced-motion preferences.

## Scope Boundaries

In scope: CSS tokens, component structure, typography, color, spacing, responsive layout, visual state hierarchy, and decorative motion.

Out of scope: API contracts, AI generation behavior, auth, payments, database changes, route changes, and content-model changes.

## Verification

- Add Playwright coverage for homepage and generator at desktop and 390px widths.
- Assert visibility of the main prompt and generate action, absence of document horizontal overflow, and stable navigation into the generator.
- Run focused Playwright tests, lint, and a production build before completion.
