import type { HumanizerLanguagePack } from "./humanizer-patterns";

/**
 * v1 English pack. Not a translation of the Chinese pack — general categories
 * (padding/rhythm/inflation/formatting/chat-residue) mirror the same
 * structural problems, but "language-specific" is its own set of English
 * fingerprints (seeded from the Wikipedia "Signs of AI writing" list already
 * cited by the humanizer-zh skill), and sentence-rhythm calibration lives in
 * toneNote rather than as a discrete pattern (see plan §1.3c).
 */
export const HUMANIZER_PATTERNS_EN: HumanizerLanguagePack = {
  lang: "en",
  toneNote:
    "Vary sentence length deliberately — human prose mixes short, medium, and long sentences; LLM output defaults to a uniform medium length ('low burstiness'). After fixing flagged patterns, scan the full passage once for rhythm: if three or more consecutive sentences have near-identical length and structure, vary at least one. Do NOT split or merge sentences just to manufacture variety where the content doesn't call for it — that itself is a detectable artifact. Match the register the input already uses (technical, formal, or conversational) rather than pulling everything toward a neutral 'helpful assistant' tone.",
  patterns: [
    {
      id: "en-padding-01",
      group: "padding",
      labelKey: "patterns.en_padding_01.label",
      llmGuidance:
        "Flag 'It's not just a button — it's a gateway to...' style false elevation that adds no information. Preserve real contrasts that correct a genuine misconception.",
      example: {
        before:
          "This isn't just an export button — it's a gateway to a new era of productivity. It exports CSV.",
        after: "This button exports CSV.",
      },
    },
    {
      id: "en-padding-02",
      group: "padding",
      labelKey: "patterns.en_padding_02.label",
      llmGuidance:
        "Flag throat-clearing openers ('Let's dive into...', 'Here's what you need to know...') that only preview the next sentence. Do not fill the deleted space with new content.",
      example: {
        before: "Let's dive into how caching works. Caching reuses results you already computed.",
        after: "Caching reuses results you already computed.",
      },
    },
    {
      id: "en-padding-03",
      group: "padding",
      labelKey: "patterns.en_padding_03.label",
      llmGuidance:
        "Flag self-defensive hedging against an imaginary objection ('To be clear, this isn't about...') with no concrete content. Preserve real caveats or limitations the reader needs.",
      example: {
        before:
          "To be clear, I'm not trying to alarm anyone here. What I mean is: confirm the backup exists before deleting.",
        after: "Confirm the backup exists before deleting.",
      },
    },
    {
      id: "en-rhythm-01",
      group: "rhythm",
      labelKey: "patterns.en_rhythm_01.label",
      llmGuidance:
        "Flag forced triads ('innovative, transformative, and groundbreaking') that add no distinct information. Preserve genuine three-item lists where each item is independent content.",
      example: {
        before: "This update is innovative, transformative, and groundbreaking. It adds export, search, and bulk rename.",
        after: "This update adds export, search, and bulk rename.",
      },
    },
    {
      id: "en-rhythm-02",
      group: "rhythm",
      labelKey: "patterns.en_rhythm_02.label",
      llmGuidance:
        "Flag stacked hedges expressing the same uncertainty twice ('might possibly perhaps reduce'). Preserve genuinely distinct qualifiers (scope vs. evidence strength) even when adjacent.",
      example: {
        before: "With caching enabled, this change might possibly perhaps reduce read latency, though this is unverified.",
        after: "With caching enabled, this change may reduce read latency, though this is unverified.",
      },
    },
    {
      id: "en-inflation-01",
      group: "inflation",
      labelKey: "patterns.en_inflation_01.label",
      llmGuidance:
        "Flag hollow 'game-changing / seamless / unlock the power of' language used as vague filler. Do not flag precise technical usage of the same words (e.g. 'seamless failover' in an infra doc describing an actual mechanism).",
      example: {
        before: "This game-changing feature seamlessly unlocks the power of your data.",
        after: "This feature lets you query your data directly.",
      },
    },
    {
      id: "en-inflation-02",
      group: "inflation",
      labelKey: "patterns.en_inflation_02.label",
      llmGuidance:
        "Flag grandiose framing ('marks a new era of collaboration') with no independent content. Preserve real plans, difficulties, and timelines stated in the same sentence.",
      example: {
        before: "The team shipped file export on Wednesday, marking a new era of collaboration. Offline editing is still in development.",
        after: "The team shipped file export on Wednesday. Offline editing is still in development.",
      },
    },
    {
      id: "en-formatting-01",
      group: "formatting",
      labelKey: "patterns.en_formatting_01.label",
      llmGuidance:
        "Reduce decorative bold that doesn't aid skimming. Preserve emphasis needed for warnings or long-document navigation, and do not strip parenthetical explanations just because bold was removed.",
      example: {
        before: "Supports **CSV (comma-separated values)** and **JSON** export.",
        after: "Supports CSV (comma-separated values) and JSON export.",
      },
    },
    {
      id: "en-chat-01",
      group: "chat-residue",
      labelKey: "patterns.en_chat_01.label",
      llmGuidance:
        "Flag 'Great question! Here's what you need to know...' filler with no independent content in stand-alone prose. Preserve such phrasing in actual correspondence or support replies.",
      example: {
        before: "Great question! Here's what you need to know: export supports CSV. Hope this helps!",
        after: "Export supports CSV.",
      },
    },
    {
      id: "en-chat-02",
      group: "chat-residue",
      labelKey: "patterns.en_chat_02.label",
      llmGuidance:
        "Remove repeated knowledge-boundary disclaimers, but never hide a real information gap or convert a guess into a stated fact.",
      example: {
        before: "Available sources don't record the company's founding date. Information on this point is admittedly limited.",
        after: "Available sources don't record the company's founding date.",
      },
    },
    {
      id: "en-lang-em-dash",
      group: "language-specific",
      labelKey: "patterns.en_lang_em_dash.label",
      llmGuidance:
        "English LLM output overuses the em-dash as an all-purpose connector far more than human baseline prose (more diagnostic in English than in Chinese, where the em-dash isn't native punctuation). Flag repeated em-dashes standing in for periods, commas, or explanations. Preserve a single well-placed em-dash for genuine parenthetical or interruptive emphasis.",
      example: {
        before: "The results are in — the answer is clear — the file failed to export.",
        after: "The file failed to export.",
      },
    },
    {
      id: "en-lang-lexicon",
      group: "language-specific",
      labelKey: "patterns.en_lang_lexicon.label",
      llmGuidance:
        "Flag hollow use of the specific over-represented LLM lexicon: 'delve into, boast(s), leverage, robust, tapestry, testament to, underscore, navigate the landscape of, seamless, foster, elevate, unlock the power of'. Only flag when the word is vague filler, not precise technical or domain usage.",
      example: {
        before: "This robust feature set truly underscores our commitment to fostering innovation.",
        after: "These features reflect our focus on new capabilities.",
      },
    },
    {
      id: "en-lang-transition-stack",
      group: "language-specific",
      labelKey: "patterns.en_lang_transition_stack.label",
      llmGuidance:
        "Flag paragraphs that mechanically open with 'Moreover, / Furthermore, / Additionally, / In conclusion,' purely as a structural tic rather than because the logical relationship needs marking. Preserve these words when they carry real sequential or causal meaning.",
      example: {
        before: "Furthermore, the export feature supports CSV. Moreover, it also supports JSON.",
        after: "The export feature supports CSV and JSON.",
      },
    },
    {
      id: "en-lang-correlative",
      group: "language-specific",
      labelKey: "patterns.en_lang_correlative.label",
      llmGuidance:
        "Flag 'not only X, but also Y' when Y adds no independent information beyond restating or inflating X. Preserve when X and Y are genuinely distinct claims.",
      example: {
        before: "This isn't only a search feature, but also a powerful tool for finding what you need.",
        after: "This search feature helps you find what you need.",
      },
    },
    {
      id: "en-lang-participial-opener",
      group: "language-specific",
      labelKey: "patterns.en_lang_participial_opener.label",
      llmGuidance:
        "Flag sentences opening with an abstract participial or gerund phrase used as inflation ('Boasting a suite of features, ...' / 'Serving as a testament to...'). This is the English structural analog to Chinese nested-的 modifier stacking — English fronts abstraction via participial phrases instead of pre-noun modifiers. Preserve when the participial phrase carries real, specific information.",
      example: {
        before: "Boasting a suite of powerful features, the update serves as a testament to the team's dedication.",
        after: "The update adds export, search, and bulk rename.",
      },
    },
  ],
};
