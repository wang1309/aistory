# Type-Inspired Homepage Design

## Context

The public homepage needs to make an anonymous visitor feel that the product is a serious writing environment they can return to, not a collection of isolated generators. The reference is Type.ai's product-led landing-page rhythm: warm space, concise navigation, a focused value proposition, restrained calls to action, and product workflow as the proof.

This is an original implementation for Story Generator. It must not copy Type.ai brand assets, copy, layout measurements, or visual identity.

## Goal

Redesign the full homepage into a coherent writing-product acquisition surface while preserving all existing homepage copy, heading hierarchy, links, FAQ content, tool-directory content, localization keys, and server-rendered SEO structure.

## Users and Funnel

- Professional and independent fiction writers.
- Fan-fiction and web-fiction writers.
- Marketing content creators.
- First action: anonymous, low-friction generation.
- Product outcome: successful first draft leads to repeat writing, saved projects, and paid retention.

## Visual Direction

- Scene: a writer opening a trusted writing workspace during a long, quiet session.
- Register: product-led homepage, not an editorial campaign or a generic AI-tools directory.
- Palette: warm pink-gray paper background, ink-blue-black text, near-black primary action, and a restrained clay accent for active or generative moments.
- Shape: thin, low-contrast structural borders; compact radii; no decorative glass, gradients, glowing orbs, or nested card frames.
- Typography: retain the existing site's loaded, Chinese-safe type families. Use scale, weight, line height, and generous negative space rather than importing a new display font.
- Motion: no ambient animation. Transitions only communicate interaction state and must honor reduced-motion preferences.

## Homepage Composition

### Navigation

- Preserve existing routes, labels, auth actions, and locale behavior.
- Make the navigation visually quiet and compact on the warm background.
- The primary anonymous entry action is the only high-contrast filled control. Login remains secondary.

### Hero and Product Proof

- Preserve the existing hero title, description, announcement, CTA labels, and destinations.
- Center the narrative on one clear promise and one primary action, rather than splitting attention between decorative media and many buttons.
- Replace decorative imagery with a writing-workspace preview that demonstrates the product state: draft, prompt, structure, and progress.
- The primary action retains its current quick-start event and scrolls to the generator. No generation logic changes.

### Creation Surface

- Keep the story generator as the first substantive action below the hero.
- Make the prompt and generate action visually dominant.
- Present model selection as an accessible compact segmented control, not a repeated feature-card row.
- Keep existing advanced controls, quota states, history, output, presets, localization, and payments intact; reveal them as supporting information.
- On mobile, retain prompt, model selection, and generate action above secondary metadata.

### Existing Marketing Sections

- Keep every existing section and its source text, links, headings, FAQs, and tool directory.
- Recompose sections as alternating narrative bands: a concise content block paired with a focused UI/product fragment where an existing visual exists.
- Do not add a repeated grid of equal icon cards. Use grouping, spacing, and adjacent content to make each existing block readable.
- Use progressively denser presentation below the generator so the homepage can carry SEO content without competing with the first conversion action.

### Trust, Pricing, FAQ, and Footer

- Preserve all pricing, policy, testimonial, FAQ, and footer copy and links.
- Use structural separators and vertically paced sections instead of enclosed floating cards.
- Give FAQ content a calm reading width and clear collapsed or expanded states without changing its text or semantic controls.

## Responsive and Accessibility Requirements

- Validate the entire homepage at desktop and 390px widths.
- Keep a visible primary action in the first mobile viewport.
- Stack product previews after the value proposition on small screens.
- Remove or hide nonessential floating controls on mobile if they can obstruct writing or reading.
- Avoid horizontal overflow; model labels, localization, buttons, and tool links must wrap or truncate intentionally.
- Preserve semantic headings, links, buttons, keyboard focus visibility, color contrast, and reduced-motion behavior.

## SEO Preservation Rules

- Do not change existing copy strings, metadata, route URLs, localized message keys, headings, FAQ answers, tool links, or schema-producing components.
- Do not replace server-rendered content with client-only content.
- Visual reordering is permitted only when DOM reading order, heading hierarchy, and primary source content remain logically equivalent.
- New supporting UI labels must be localized and must not replace existing SEO-targeted copy.

## Scope Boundaries

In scope: homepage visual tokens, section composition, spacing, typography, hierarchy, responsive behavior, visual state styling, and the existing story-generator presentation.

Out of scope: generation behavior, API contracts, authentication, payment logic, database schema, page routes, existing copy, metadata, and SEO content models.

## Verification

- Add or update focused source tests for the preserved primary generation anchor, primary CTA behavior, and mobile model control.
- Perform visual checks for desktop and 390px mobile viewports.
- Run focused tests, `pnpm lint`, and `pnpm build`.
- Inspect the final diff to ensure only intended visual files and this specification are staged.
