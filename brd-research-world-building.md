# World Building Keyword Research

Research date: 2026-09-22

## Decision

**Conditional GO for a structured “AI Worldbuilding” entry point that feeds the existing AI Write Story Bible. HOLD on a standalone, one-shot `world building generator` that only emits a block of lore.**

The user job behind `world building` is real, but the term is broad and the spelling is split between `world building` and `worldbuilding`. In fiction and tabletop contexts, users generally expect an evolving reference system: people, places, factions, rules, timelines, maps, and cross-links. A single form that generates a fantasy setting does not meet that expectation, and it would compete with the site's existing Fantasy Worldbuilder Mode.

The strongest opportunity is a **World Bible Quickstart**: turn a premise into editable, connected world records, save them to Story Bible, then use them when writing. It gives the existing long-form writing workbench a clearer acquisition path while avoiding a thin SEO clone.

## Evidence and Limits

### Verified in the repository

- `Fantasy Generator` already has a multi-step **Worldbuilder Mode**: subgenre, setting, magic system, characters, and plot. Its output is still a fantasy story generated from those details, rather than a persistent world reference. See [`src/i18n/pages/fantasy/en.json`](/Users/rain/GolandProjects/wang1309/aistory/src/i18n/pages/fantasy/en.json) and [`src/app/api/fantasy-generate/route.ts`](/Users/rain/GolandProjects/wang1309/aistory/src/app/api/fantasy-generate/route.ts).
- AI Write already has a persistent **Story Bible** for characters, relationships, and world lore, and references it during continuations. See [`src/i18n/pages/ai-write-landing/en.json`](/Users/rain/GolandProjects/wang1309/aistory/src/i18n/pages/ai-write-landing/en.json) and [`src/app/api/story-bible/route.ts`](/Users/rain/GolandProjects/wang1309/aistory/src/app/api/story-bible/route.ts).
- The site also has useful worldbuilding atoms: D&D backstory, backstory, city nickname, gang-name, elf-name, fantasy, story prompt, and story outline tools.

### Directly verified external supply

- [Campfire](https://www.campfirewriting.com/) publicly presents worldbuilding alongside characters, maps and locations, timelines and calendars, and lists dedicated worldbuilding, interactive maps, calendar, timeline, and conlang tools. Its public homepage states paid unlimited plans begin at `$0.50/month` and also offers lifetime purchases; this is a published competitor claim, not a pricing recommendation.
- [Novelcrafter](https://www.novelcrafter.com/) publicly describes its Codex as a “Story Bible & World Builder,” with automatic tracking/linking for characters, locations, and lore, and says a Codex can be shared across books in a series.
- [World Anvil](https://www.worldanvil.com/) was reached but served a Cloudflare verification page, so no feature or pricing claims from it are used here. Its visible route remains a signal of established specialist supply only.

### Not verified in this pass

Google Trends, Google Search, Google Autocomplete, Reddit, keyword tools, review sites, and competitor traffic data were not reachable. Therefore this document does **not** claim search volume, KD, CPC, geography, trend direction, current rankings, recurring review complaints, conversion, or TAM.

Before an implementation decision, obtain data for US/global English in Google Keyword Planner and Ahrefs/Semrush, and manually inspect the live result pages. Record their formats: tool, template, article, game-specific database, Minecraft/building content, or software landing page.

## Intent Split

| Query family | Actual job | Expected outcome | Product implication |
| --- | --- | --- | --- |
| `world building`, `worldbuilding` | Broad practice of developing a fictional setting. | Advice, templates, examples, or software. | Do not treat as a direct generator query. |
| `worldbuilding generator`, `world building generator`, `AI worldbuilding generator` | Get setting ideas quickly. | Structured starter concepts, often fantasy. | Candidate acquisition intent if output becomes editable records. |
| `fantasy world generator`, `fantasy worldbuilding generator` | Create a fantasy setting and its rules. | Geography, factions, magic, lore, names. | Strong adjacency to the existing Fantasy Worldbuilder Mode. |
| `worldbuilding template`, `worldbuilding questions`, `worldbuilding checklist` | Plan a world methodically. | Downloadable/notion-like schema or guide. | Content/template intent; use a free starter template, not an AI-only page. |
| `worldbuilding prompts`, `fantasy world ideas` | Break a creative block. | Prompt list, randomizer, idea generator. | Light free utility or supporting SEO content. |
| `worldbuilding software`, `worldbuilding app`, `worldbuilding tool` | Maintain a growing fictional universe. | Persistent database/wiki, links, search, timelines/maps. | High-value but high product-expectation category. |
| `D&D world generator`, `campaign world builder` | Prepare a tabletop campaign. | Session-ready regions, factions, hooks, NPCs, constraints. | Strong niche and existing D&D-tool fit. |
| `sci-fi world generator`, `sci fi worldbuilding` | Create speculative systems and a setting. | Technology, society, planets, conflict rules. | A future genre lens, not a separate V1 product. |
| `Minecraft world building`, `world building game` | Build a game environment. | Game ideas, construction guides, assets. | Exclude; unrelated audience and delivery. |

The singular spelling, open spelling, and genre modifiers should be reported together but not summed as independent traffic. The template/software queries also have different expected deliverables from generator queries.

## Keyword Priority Map

| Priority | Cluster | Why it matters | Suggested action |
| --- | --- | --- | --- |
| P0 | `AI worldbuilding generator`, `worldbuilding generator`, `fantasy world generator` | Closest tool intent and a plausible bridge into AI Write. | Validate volume and SERP tool density before creating a canonical landing page. |
| P0 | `worldbuilding software`, `worldbuilding app`, `worldbuilding tool` | Higher-value workflow need, but specialist competitors set a high bar. | Target only when persistent structured records are genuinely usable. |
| P1 | `D&D world generator`, `campaign world builder`, `RPG worldbuilding` | A clear recurring workflow with established site adjacency. | Add a tabletop starter mode after the generic structured workflow works. |
| P1 | `worldbuilding template`, `worldbuilding checklist`, `worldbuilding questions` | Likely informational/template SERP; can earn topical authority. | Publish one high-quality interactive template or guide that leads into the workbench. |
| P1 | `worldbuilding prompts`, `fantasy world ideas` | Useful top-of-funnel demand, but lower commercial intent. | Use as supporting content or a prompt mode, not a duplicate tool route. |
| P2 | `sci-fi world generator`, `sci fi worldbuilding` | Distinct conventions and content needs. | Add as a preset only after user demand proves genre expansion. |
| Exclude | `Minecraft world building`, `world building game`, architecture/urban planning uses | Different task, audience, and output. | Do not borrow this traffic with ambiguous page copy. |

## Competitive Reality

| Category | Established expectation | Implication for Aistory |
| --- | --- | --- |
| Specialist worldbuilding suites, such as Campfire and World Anvil | Many connected modules: people, places, lore, maps, calendars, timelines, and publishing/sharing. | Do not call a text generator a full “worldbuilding software” product. |
| Story-writing workbenches, such as Novelcrafter | Persistent Codex/wiki, automatic links and long-project reuse. | AI Write's Story Bible is the credible base, but needs more structured world entities before targeting this intent strongly. |
| AI story generators | Fast setting ideas and fantasy drafts. | Existing Fantasy Worldbuilder Mode is already competitive for the first idea; it needs a save-to-Bible handoff, not another prompt form. |
| Tabletop generators | Usable campaign outputs: regions, factions, NPCs, hooks, consequences, and game constraints. | D&D can become a viable focused wedge because it has concrete repeat usage. |
| Templates and guides | Question lists and planning frameworks. | Educational content can win informational intent without pretending to replace a database. |

The core competitive problem is not “can an LLM invent lore?” It can. The high-value problem is turning generated details into a source of truth that stays internally consistent and helps the writer make the next decision.

## Core User and Job To Be Done

### First target: fiction writer building an original series

They have a premise and perhaps characters, but their setting is scattered across notes. They need to decide rules, places, factions, cultural norms, and unresolved conflicts while preserving those decisions across chapters. They are likely to value a free Quickstart and later pay for saved projects, reference retrieval, consistency checks, and cross-project management. Exact willingness to pay remains unverified.

### Strong niche: tabletop game master

They need a usable campaign world before a session: an immediate location, faction motive, conflict, NPC hook, and a few expandable secrets. They often revisit and remix the same world. The value is a structured, table-ready preparation flow, not a long literary encyclopedia.

### Secondary: hobby worldbuilder

They may build for its own sake, roleplay, art, or a personal wiki. Engagement can be high, but monetization is uncertain and specialist platforms already serve them. Treat this as an audience to learn from, not the default initial buyer.

## Product Recommendation

### Build a World Bible Quickstart, not a detached generator

The starting route may be named `AI Worldbuilding Generator` only if live SERP validation supports it. Its real product should be:

1. One premise and a genre/medium choice: novel, tabletop campaign, or game concept.
2. A short guided setup: world premise, central conflict, scope, technology/magic rules, and desired tone.
3. Generated **editable cards**, not one prose document:
   - World premise and themes
   - Rules / costs / limits
   - Places / regions
   - Factions and tensions
   - Cultures or institutions
   - Timeline anchors
   - Story hooks and open questions
4. A user can accept, edit, regenerate, or delete each card separately.
5. “Save to Story Bible” writes the selected cards to the existing persistent world-lore surface, then opens AI Write with that context available.
6. Use the existing city, faction, name, backstory, and outline tools as contextual next steps rather than unrelated tool cards.

### Do not build in V1

- Maps, calendars, conlang editors, or public wikis.
- Claims of automatic factual or lore correctness.
- A full World Anvil/Campfire replacement.
- Separate thin routes for fantasy, sci-fi, D&D, romance, and every other genre.
- Import from competitors or any copyrighted franchise reference database.

## Existing-Site Fit

| Current capability | Reuse value | Gap to close |
| --- | --- | --- |
| Fantasy Worldbuilder Mode | Captures setting, magic, characters, and plot. | It currently writes a story, rather than preserving world data as reusable cards. |
| AI Write Story Bible | Persistent world lore and automatic reference during continuations. | It needs a world-first onboarding path and a more visible structured model. |
| Story Outline / Prompt tools | Can transform world constraints into plot. | Need intentional handoffs instead of isolated outputs. |
| Backstory / D&D Backstory | Builds character motivations and campaign hooks. | Need a shared world reference passed into generation. |
| City nickname / gang / elf-name generators | Supplies individual flavor elements. | Need parent-world context and save/link actions. |

The appropriate product architecture is:

`World Bible Quickstart -> editable world records -> Story Bible -> AI Write / outline / character / campaign tools`

This is a workflow, so it should be implemented as a real entry point into the workbench. It should not be a standalone static result page that duplicates Fantasy Generator.

## SEO and Content Strategy

### Canonical product page, only after the keyword gate

- H1: `AI Worldbuilding Generator` or `Worldbuilding Generator`, selected from real query data.
- Supporting language: `world building`, `fantasy world generator`, `worldbuilding tool`, and `world bible`.
- Avoid promising “worldbuilding software” until structured records, retrieval, and persistence are demonstrably present.
- Use one canonical page. Genre selection should be a mode/preset, not a family of near-duplicate URLs.

### Supporting content

- `Worldbuilding checklist for writers`: explain which decisions must be made first and link into the Quickstart.
- `Worldbuilding questions`: an interactive question sequence with copy/save actions.
- `How to build a fantasy world`: substantive guidance and an example of rule/cost/limit thinking.
- `D&D campaign worldbuilding`: only once the tabletop mode produces table-ready output.

No article should claim that generated material is automatically original, legally clear, or internally correct. It should advise writers to review, revise, and avoid reproducing protected franchise-specific settings.

## Keyword Validation Sheet

Capture this for US and global English before forecasting traffic:

| Query | Volume | KD | CPC | Trend (5y / 12m) | Top result mix | Decision |
| --- | ---: | ---: | ---: | --- | --- | --- |
| `worldbuilding` | Pending | Pending | Pending | Pending | Pending | Categorize broad-intent result types. |
| `world building` | Pending | Pending | Pending | Pending | Pending | Measure spelling overlap, do not double count. |
| `worldbuilding generator` | Pending | Pending | Pending | Pending | Pending | Canonical generator candidate. |
| `AI worldbuilding generator` | Pending | Pending | Pending | Pending | Pending | Validate tool intent and AI supply. |
| `fantasy world generator` | Pending | Pending | Pending | Pending | Pending | Compare against existing Fantasy route. |
| `worldbuilding software` | Pending | Pending | Pending | Pending | Pending | Only target if the product meets workflow expectations. |
| `worldbuilding template` | Pending | Pending | Pending | Pending | Pending | Content/template decision. |
| `worldbuilding questions` | Pending | Pending | Pending | Pending | Pending | Supporting content decision. |
| `D&D world generator` | Pending | Pending | Pending | Pending | Pending | Test tabletop niche intent. |
| `Minecraft world building` | Pending | Pending | Pending | Pending | Pending | Explicitly exclude unrelated traffic. |

Do not pass the keyword gate based on volume alone. For the proposed canonical term, at least half of visible high-ranking results should be tools, workbenches, or generator pages serving fiction/tabletop users. If the SERP is dominated by tutorials and templates, publish an educational template first rather than forcing a tool page.

## Validation Plan and Metrics

1. Check the keyword sheet and inspect the live SERP before selecting the H1/slug.
2. Interview 8-10 fiction writers and game masters who have a current project. Ask what they use for canon, when they lose track of details, which notes they revisit, and what they currently pay for.
3. Prototype five editable card types with save-to-Story-Bible. Do not build maps or a general wiki first.
4. Test the handoff: ask users to create a world, then draft an opening scene and verify whether the saved context is actually useful and accurate.
5. Measure only non-content event metadata: quickstart start/completion, number of accepted/edited cards, save-to-Bible, first continuation after save, return rate, and project reuse. Do not put user world text in analytics.

| Gate | Pass condition | Decision |
| --- | --- | --- |
| Intent | Keyword tool and SERP inspection identify an interactive fiction/tabletop tool cluster. | Publish the canonical entry page. |
| Activation | At least 25% of qualified landing sessions finish the starter flow. | Keep improving question sequence and positioning. |
| Ownership | At least 30% of finishers edit, replace, or remove one generated card. | Confirms users treat the result as editable project material, not disposable copy. |
| Workflow handoff | At least 20% of finishers save to Story Bible; at least 10% then open a writing or planning action. | Confirms the feature strengthens the workbench. |
| Repeat value | At least 5% return to the same project within 30 days, or interviews demonstrate a recurring session/campaign need. | Invest in persistence and richer cross-links. |
| Paid pull | At least 3 of 10 qualified repeat users say they would trial higher project limits or advanced consistency features. | Test bundle pricing rather than a separate generator plan. |

The figures are validation hypotheses, not industry benchmarks; recalibrate against the site's existing creative-tool funnels.

## Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Intent mismatch | Broad `world building` searches include games, Minecraft, education, and real-world planning. | Use precise fiction/tabletop modifiers and inspect SERPs. |
| Product overclaim | “Worldbuilding software” implies durable structured knowledge management. | Use generator language until persistence/retrieval is mature. |
| Cannibalization | Fantasy Worldbuilder Mode already captures a similar starting point. | Make saveable cards and Story Bible handoff mandatory differentiators. |
| Context drift | More world facts raise the chance of AI contradiction. | Store concise canonical facts, retrieve relevant records, and offer an explicit consistency check. |
| Feature sprawl | Maps, languages, calendars, and wikis can consume months. | Limit V1 to the records that make the next writing session better. |
| Copyright and imitation | Users may request protected worlds/franchises. | Frame outputs as original setting creation, offer refusal/guardrails where necessary, and never promise legal clearance. |

## Go / No-Go Scorecard

### Standalone one-shot world generator

- [x] The core creative task is understandable.
- [x] The site already has a fantasy worldbuilder-like form.
- [ ] Keyword demand, trend, and live SERP format are verified.
- [ ] A one-shot result provides value beyond the existing Fantasy tool.
- [ ] The product differentiates from established suites.

**Decision: NO-GO.** A detached long-form lore output would duplicate an existing flow and underdeliver relative to market expectations.

### World Bible Quickstart inside AI Write

- [x] Story Bible provides a persistent destination for world context.
- [x] Existing tools supply useful connected sub-jobs.
- [x] The product can differentiate through editable cards and downstream writing use.
- [ ] Search demand and exact canonical wording remain unverified.
- [ ] Card editing, retrieval, and continuity behavior need prototype validation.

**Decision: conditional GO.** Validate the generator/software keyword split, then prototype the workflow as an AI Write acquisition and activation path.

## Sources and Internal References

- [Campfire](https://www.campfirewriting.com/), accessed 2026-09-22.
- [Novelcrafter](https://www.novelcrafter.com/), accessed 2026-09-22.
- [World Anvil](https://www.worldanvil.com/), route checked 2026-09-22; page content was inaccessible because of Cloudflare verification.
- [`src/i18n/pages/ai-write-landing/en.json`](/Users/rain/GolandProjects/wang1309/aistory/src/i18n/pages/ai-write-landing/en.json), accessed 2026-09-22.
- [`src/i18n/pages/fantasy/en.json`](/Users/rain/GolandProjects/wang1309/aistory/src/i18n/pages/fantasy/en.json), accessed 2026-09-22.
- [`src/app/api/fantasy-generate/route.ts`](/Users/rain/GolandProjects/wang1309/aistory/src/app/api/fantasy-generate/route.ts), accessed 2026-09-22.
- [`src/app/api/story-bible/route.ts`](/Users/rain/GolandProjects/wang1309/aistory/src/app/api/story-bible/route.ts), accessed 2026-09-22.

