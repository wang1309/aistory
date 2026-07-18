# Type-Inspired Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Restyle the full localized homepage as a warm, product-led writing workspace while preserving all existing copy, URLs, semantic headings, schema output, and generation behavior.

**Architecture:** Keep src/app/[locale]/(default)/page.tsx as the server-rendered composition root and preserve its current block order. Restyle existing blocks in place using shared warm-paper tokens. Do not change message JSON, routes, services, metadata, or schema code. Decorative animation becomes brief state feedback only.

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, next-intl, Framer Motion, and Node's built-in test runner through tsx.

---

## File Structure

- src/app/theme.css: light and dark tokens, compact radius scale, neutral shadows, and reduced-motion baseline.
- src/app/[locale]/(default)/page.tsx: existing server-rendered block sequence and matching loading skeletons.
- src/components/blocks/header/index.tsx and src/components/blocks/footer/index.tsx: shared navigation and footer framing.
- src/components/blocks/hero/index.tsx and src/components/blocks/story-generate/index.tsx: hero proof and primary creation surface.
- src/components/sections/feature-intro.tsx, benefits.tsx, how-to-use.tsx, and use-cases.tsx: original SEO content restyled as narrative bands.
- src/components/blocks/module-tools/index.tsx, branding/index.tsx, showcase/index.tsx, and stats/index.tsx: tool and proof content.
- src/components/blocks/pricing/index.tsx, testimonial/index.tsx, src/components/sections/faq.tsx, and cta.tsx: conversion tail.
- src/components/feedback/index.tsx, src/components/scroll-to-generator.tsx, and src/components/onboarding/story-guide.tsx: mobile overlap and first-run behavior.
- tests/editorial-writing-surface.test.ts, tests/homepage-generator-p0.test.ts, tests/generator-nav-tabs-lib.test.ts, and tests/type-inspired-homepage-seo.test.ts: source-level guardrails.

### Task 1: Lock SEO and Primary-Action Contracts

**Files:**

- Modify: tests/editorial-writing-surface.test.ts
- Modify: tests/homepage-generator-p0.test.ts
- Modify: tests/generator-nav-tabs-lib.test.ts
- Create: tests/type-inspired-homepage-seo.test.ts

- [ ] **Step 1: Write the failing homepage-order test**

Create tests/type-inspired-homepage-seo.test.ts:

    import assert from "node:assert/strict";
    import { readFileSync } from "node:fs";
    import test from "node:test";

    const pageSource = readFileSync(
      "src/app/[locale]/(default)/page.tsx",
      "utf8"
    );

    test("homepage retains its server-rendered SEO block order", () => {
      const blocks = [
        "{page.hero && <Hero hero={page.hero} />}",
        "<StoryGenerate section={page.story_generate} />",
        "<ModuleToolsSection",
        "{page.branding && <Branding section={page.branding} />}",
        "{page.pricing && <Pricing pricing={page.pricing} />}",
        "{page.faq && <SectionFAQ section={page.faq} accent=\"orange\" />}",
        "{page.cta && <SectionCTA section={page.cta} accent=\"orange\" />}",
      ];
      const positions = blocks.map((block) => pageSource.indexOf(block));

      assert.ok(positions.every((position) => position >= 0));
      assert.deepEqual([...positions].sort((a, b) => a - b), positions);
      assert.match(pageSource, /application\/ld\+json/);
    });

Extend editorial-writing-surface.test.ts to require data-testid="hero-quick-start", a rounded-md primary action, no bg-clip-text text-transparent, the warm token values, and compact model-control markup. Retain the current craft_story and story-prompt-input assertions.

- [ ] **Step 2: Run the new source tests**

Run:

    pnpm exec tsx --test tests/editorial-writing-surface.test.ts tests/homepage-generator-p0.test.ts tests/generator-nav-tabs-lib.test.ts tests/type-inspired-homepage-seo.test.ts

Expected: the new Type-inspired visual assertions fail before implementation.

- [ ] **Step 3: Commit the test contract**

    git add tests/editorial-writing-surface.test.ts tests/homepage-generator-p0.test.ts tests/generator-nav-tabs-lib.test.ts tests/type-inspired-homepage-seo.test.ts
    git commit -m "test: lock homepage visual and seo contracts"

### Task 2: Establish the Warm Product System and Shell

**Files:**

- Modify: src/app/theme.css
- Modify: src/app/[locale]/(default)/page.tsx
- Modify: src/components/blocks/header/index.tsx
- Modify: src/components/blocks/footer/index.tsx

- [ ] **Step 1: Apply the shared token system**

Replace top-level light tokens and their dark semantic counterparts:

    :root {
      --background: oklch(0.985 0.009 78);
      --foreground: oklch(0.205 0.018 55);
      --card: oklch(0.965 0.01 78);
      --primary: oklch(0.67 0.14 55);
      --secondary: oklch(0.205 0.018 55);
      --muted: oklch(0.92 0.014 75);
      --muted-foreground: oklch(0.47 0.018 58);
      --border: oklch(0.86 0.016 72);
      --input: oklch(0.965 0.01 78);
      --ring: oklch(0.67 0.14 55);
      --radius: 0.5rem;
    }

    .dark {
      --background: oklch(0.16 0.01 55);
      --foreground: oklch(0.92 0.012 75);
      --card: oklch(0.205 0.012 55);
      --muted: oklch(0.245 0.014 55);
      --border: oklch(0.31 0.014 55);
      --input: oklch(0.205 0.012 55);
      --radius: 0.5rem;
    }

Delete unused gradient and blob properties. Add a global prefers-reduced-motion: reduce rule that disables nonessential animation and smooth scroll.

- [ ] **Step 2: Restyle the shared frame without changing content**

Replace HeroSkeleton's min-h-[92vh] rounded pills with a content-height bordered manuscript skeleton. In header and footer, retain every label, route, auth condition, locale control, and link. Apply border-border/70 bg-background to the shell, rounded-md to controls, and bg-foreground text-background to the sole primary auth or entry action. Remove glass, gradients, floating card layers, and oversized radii.

- [ ] **Step 3: Verify the token and SEO contract**

Run:

    pnpm exec tsx --test tests/editorial-writing-surface.test.ts tests/homepage-generator-p0.test.ts tests/generator-nav-tabs-lib.test.ts tests/type-inspired-homepage-seo.test.ts

Expected: all tests pass.

- [ ] **Step 4: Commit the shell**

    git add src/app/theme.css 'src/app/[locale]/(default)/page.tsx' src/components/blocks/header/index.tsx src/components/blocks/footer/index.tsx
    git commit -m "style: establish warm product homepage shell"

### Task 3: Rebuild the Hero and Creation Surface

**Files:**

- Modify: src/components/blocks/hero/index.tsx
- Modify: src/components/blocks/story-generate/index.tsx

- [ ] **Step 1: Replace decorative hero media with static product proof**

Keep hero.disabled, announcement, title, description, buttons, tip, happy-users content, and all existing localized strings. Remove Prism, dynamic remote story images, STORY_IMAGES, client-mount entrance state, radial gradients, and ambient animation.

Use this structure while retaining the quick-start event and craft_story scroll:

    <section className="border-b border-border/70 bg-background py-16 sm:py-20 lg:py-24">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">...</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">...</p>
          <button data-testid="hero-quick-start" className="mt-8 inline-flex h-12 rounded-md bg-foreground px-5 text-background">...</button>
        </div>
        <div className="mx-auto mt-12 max-w-4xl border border-border bg-card p-5 sm:p-7">...</div>
      </div>
    </section>

The preview is semantic static markup: workspace heading, document-title rule, manuscript rules, and selected prompt line. It must not add remote image assets.

- [ ] **Step 2: Make the generator prompt-first**

Remove decorative radial layers, animated orbs, double-bezel wrappers, and the initial hidden sectionVisible state. Preserve id="craft_story", form inputs, request logic, output rendering, auth flow, quota behavior, and localized data.

Use a single border border-border bg-card workbench. Render navigation only inside:

    <div className="hidden border-y border-border/70 bg-card md:block">
      <GeneratorNavTabs />
    </div>

Replace model cards with data-testid="story-model-control", role="radiogroup", child role="radio", aria-checked, selected bg-foreground text-background, and min-w-0 truncate labels. Hide keyboard hints and usage metadata below sm.

- [ ] **Step 3: Run focused tests**

Run:

    pnpm exec tsx --test tests/editorial-writing-surface.test.ts tests/homepage-generator-p0.test.ts tests/generator-nav-tabs-lib.test.ts tests/type-inspired-homepage-seo.test.ts

Expected: all tests pass without weakening assertions.

- [ ] **Step 4: Commit the acquisition surface**

    git add src/components/blocks/hero/index.tsx src/components/blocks/story-generate/index.tsx
    git commit -m "style: refocus homepage on writing workspace"

### Task 4: Convert Existing Content into Narrative Bands

**Files:**

- Modify: src/components/sections/feature-intro.tsx
- Modify: src/components/sections/benefits.tsx
- Modify: src/components/sections/how-to-use.tsx
- Modify: src/components/sections/use-cases.tsx
- Modify: src/components/blocks/module-tools/index.tsx
- Modify: src/components/blocks/branding/index.tsx
- Modify: src/components/blocks/showcase/index.tsx
- Modify: src/components/blocks/stats/index.tsx

- [ ] **Step 1: Preserve every data input and remove decoration**

Keep each existing section's disabled, label, title, description, item list, image source, image alt, button title, and href consumption unchanged. Delete gradient text, gradient backgrounds, radial-div markup, blurred circles, mouse spotlight state, image reflections, stacked-card shells, hover lifts, and scroll transforms that displace content.

- [ ] **Step 2: Apply the two layout primitives**

Use this split narrative band for image or proof content:

    <section className="border-b border-border/60 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl">...</div>
        <div className="border border-border bg-card p-4 sm:p-6">...</div>
      </div>
    </section>

Use this ruled reading band for lists, process steps, tools, and proof rows:

    <section className="border-b border-border/60 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">...</div>
        <div className="mt-10 divide-y divide-border border-y border-border">...</div>
      </div>
    </section>

Use Framer Motion only for opacity/translate-y reveal inside MotionConfig reducedMotion="user". Do not add client state, remote assets, or copy strings.

- [ ] **Step 3: Run focused tests and lint**

Run:

    pnpm exec tsx --test tests/editorial-writing-surface.test.ts tests/homepage-generator-p0.test.ts tests/generator-nav-tabs-lib.test.ts tests/type-inspired-homepage-seo.test.ts
    pnpm lint

Expected: source tests pass; lint has no new errors in modified components.

- [ ] **Step 4: Commit narrative bands**

    git add src/components/sections/feature-intro.tsx src/components/sections/benefits.tsx src/components/sections/how-to-use.tsx src/components/sections/use-cases.tsx src/components/blocks/module-tools/index.tsx src/components/blocks/branding/index.tsx src/components/blocks/showcase/index.tsx src/components/blocks/stats/index.tsx
    git commit -m "style: turn homepage content into narrative bands"

### Task 5: Simplify Trust and Conversion Sections

**Files:**

- Modify: src/components/blocks/pricing/index.tsx
- Modify: src/components/blocks/testimonial/index.tsx
- Modify: src/components/sections/faq.tsx
- Modify: src/components/sections/cta.tsx

- [ ] **Step 1: Preserve transaction, auth, and copy behavior**

Keep checkout request construction, OpenPanel events, auth prompts, product IDs, pricing groups, button titles, testimonial content, FAQ labels and answers, CTA destinations, and current aria behavior. Do not change i18n JSON or API code.

- [ ] **Step 2: Replace card effects with reading-first structure**

Use one flat bordered pricing plan per item. Only the featured plan may use a near-black filled CTA. Remove rounded-3xl, gradient glow, featured scaling, colored shadows, and hover lifts.

For testimonials, retain the existing interaction and content but use a divided list or fixed-width horizontal row. For FAQ, retain button and open state but use border-b border-border, one plus/minus icon, and existing disclosure motion or grid-template-rows. Make CTA a centered final invitation bounded by top and bottom rules.

- [ ] **Step 3: Run behavioral and source tests**

Run:

    pnpm exec tsx --test tests/activation-funnel.test.ts tests/auth-funnel.test.ts tests/editorial-writing-surface.test.ts tests/homepage-generator-p0.test.ts tests/generator-nav-tabs-lib.test.ts tests/type-inspired-homepage-seo.test.ts

Expected: all tests pass.

- [ ] **Step 4: Commit conversion tail**

    git add src/components/blocks/pricing/index.tsx src/components/blocks/testimonial/index.tsx src/components/sections/faq.tsx src/components/sections/cta.tsx
    git commit -m "style: simplify homepage conversion sections"

### Task 6: Protect Mobile Reading and First-Run State

**Files:**

- Modify: src/components/feedback/index.tsx
- Modify: src/components/scroll-to-generator.tsx
- Modify: src/components/onboarding/story-guide.tsx
- Modify: tests/story-guide.test.ts

- [ ] **Step 1: Write failing mobile and first-run assertions**

Assert that story-guide.tsx registers start-story-guide but does not contain window.setTimeout(() => startGuide(), 1000). Assert feedback and scroll-to-generator wrappers include hidden sm:block.

- [ ] **Step 2: Implement restrained mobile behavior**

Delete the onboarding timer and cleanup, preserving the explicit guide event. Make feedback and scroll wrappers hidden sm:block, use bordered bg-card text-foreground icon buttons, and set desktop offsets through sm:bottom-* and sm:right-*. Preserve all handlers, dialog state, aria labels, and desktop behavior.

- [ ] **Step 3: Run first-run tests**

Run:

    pnpm exec tsx --test tests/story-guide.test.ts tests/editorial-writing-surface.test.ts tests/homepage-generator-p0.test.ts tests/generator-nav-tabs-lib.test.ts tests/type-inspired-homepage-seo.test.ts

Expected: all tests pass.

- [ ] **Step 4: Commit mobile protections**

    git add src/components/feedback/index.tsx src/components/scroll-to-generator.tsx src/components/onboarding/story-guide.tsx tests/story-guide.test.ts
    git commit -m "style: protect mobile writing surface"

### Task 7: Verify the Full Homepage

**Files:**

- Modify only if a focused verification failure requires a scoped correction in files from Tasks 2 through 6.

- [ ] **Step 1: Run final focused tests**

    pnpm exec tsx --test tests/editorial-writing-surface.test.ts tests/homepage-generator-p0.test.ts tests/generator-nav-tabs-lib.test.ts tests/type-inspired-homepage-seo.test.ts tests/story-guide.test.ts

Expected: all tests pass.

- [ ] **Step 2: Run repository quality gates**

    pnpm lint
    pnpm build

Expected: both commands exit successfully. Record only existing warnings, including the invalid next.config.mjs turbopack key and unrelated lint warnings, if present.

- [ ] **Step 3: Inspect desktop and mobile visual states**

Run the production preview and inspect / at 1440x900 and 390x844. Confirm a visible hero primary action, a static workspace preview below hero copy, a non-overlapping prompt/model/generate surface, no horizontal overflow, and the presence of all existing content, pricing, FAQ, CTA, and footer blocks in DOM order.

- [ ] **Step 4: Inspect the handoff diff**

    git diff --check HEAD~6..HEAD
    git status --short

Expected: no whitespace errors. The only remaining worktree change is the user-owned .gitignore entry for .superpowers, unless a verification fix remains uncommitted.

