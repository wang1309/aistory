# Blog Reader Experience Design

**Date:** 2026-07-19  
**Scope:** Blog index (`/posts`) and post detail (`/posts/[slug]`)

## Goal

Make the blog feel like a focused reading destination for fiction writers while preserving the existing server-rendered data flow, routes, and translation behavior.

## Chosen Direction

Use a warm editorial reading desk: Source Serif 4 carries article titles and body copy; DM Sans carries navigation, metadata, filters, and actions. The page uses the existing cream, charcoal, and amber theme rather than adding a separate visual system.

## Blog Index

- Create a generous editorial masthead with the blog title, description, and an understated index label.
- Keep category filtering as links. Selected and keyboard-focus states must be unambiguous; the filters wrap without changing their intended tap size on narrow screens.
- Feature the first available article in a prominent lead treatment. Remaining posts form a two-column reading flow from tablet size upward.
- Preserve article cover images when supplied. When a cover is absent, render a fixed-aspect-ratio typographic placeholder so card height and scan rhythm remain stable.
- Each article link remains one accessible target and gets a visible focus indicator. Hover effects use only transform, opacity, and color.
- Preserve the existing empty state with clearer spacing and an editorially neutral presentation.

## Post Detail

- Build a reading-first article header with breadcrumb, category, title, and date before the content.
- Restrict the Markdown column to a comfortable reading measure and use the display serif for prose hierarchy.
- Convert author and category information from visually competing cards into a quiet desktop side rail. On mobile it moves below the article body.
- Keep Markdown as the existing rendering path; the redesign must not alter post content, links, or HTML semantics.

## Responsive Behavior

- Below `md`, use a single-column layout, `px-4` page gutters, and no overlaps or rotated elements.
- The index lead and post cards stack vertically. Image and fallback media retain their aspect ratio.
- Detail metadata and side rail become normal document flow below the content, preventing narrow reading columns or hidden information.

## Accessibility And Performance

- Use one visible `h1` per page, preserve heading hierarchy in article content, and maintain adequate text contrast in both themes.
- Provide meaningful cover-image alt text from the article title; decorative fallback surfaces have no alternative text.
- Use direct `lucide-react` imports only when an icon improves a command or cue.
- Do not add client-side data fetching, scroll listeners, large animation libraries, or browser-wide visual effects. Animations honor `prefers-reduced-motion` and are restricted to GPU-safe properties.

## Validation

- Run the focused type/lint checks available in the project and production build when feasible.
- Verify the blog index and post detail at desktop and mobile viewport widths, including article lists with cover images, without cover images, and empty content.
- Confirm category filtering retains its query string and article links preserve locale-aware paths.

## Out Of Scope

- Changing the post schema, admin editor, categories, API routes, global header/footer, or published blog copy.
- Creating or publishing database records.
