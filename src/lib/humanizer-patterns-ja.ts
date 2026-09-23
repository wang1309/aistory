import type { HumanizerLanguagePack } from "./humanizer-patterns";

/**
 * v1 Japanese pack. General categories mirror the same structural problems
 * as zh/en; "language-specific" seeds from concrete, sourced Japanese
 * AI-writing fingerprints (文末の単調さ, 抽象語の多用, 同義反復, "これにより"
 * connector overuse) documented in Japanese-language editing guides on
 * detecting AI-generated text (see plan follow-up, 2026-09 research pass),
 * not translated from the English/Chinese packs.
 */
export const HUMANIZER_PATTERNS_JA: HumanizerLanguagePack = {
  lang: "ja",
  toneNote:
    "文末のリズムに変化をつける — 「〜です」「〜ます」が3文以上連続すると単調で機械的に響く。体言止めや「〜だろう」「〜のだ」など異なる文末を交ぜて自然な抑揚を作る。ただし内容に合わない変化を無理に加えないこと。原文の敬語レベル（です/ます調、である調、口語）は保持し、すべてを中立的な説明口調に均さない。固有名詞・数値・具体的な事実はそのまま残し、抽象的な言い換えで置き換えない。",
  patterns: [
    {
      id: "ja-padding-01",
      group: "padding",
      labelKey: "patterns.ja_padding_01.label",
      llmGuidance:
        "Flag throat-clearing openers like '近年、〜が注目されています' or '〜という時代背景の中で' that only set generic scene-setting with no independent content. Preserve when the background genuinely carries a specific fact (a date, a trend with a number) the argument depends on.",
      example: {
        before: "近年、観光業界が注目されています。西みやこ市では外国人観光客が増えています。",
        after: "西みやこ市では、外国人観光客が前年比35%増加しました。",
      },
    },
    {
      id: "ja-padding-02",
      group: "padding",
      labelKey: "patterns.ja_padding_02.label",
      llmGuidance:
        "Flag 'これは単なる〜ではなく、〜なのです' false-elevation openers. Preserve genuine contrasts that correct a real misunderstanding.",
    },
    {
      id: "ja-rhythm-01",
      group: "rhythm",
      labelKey: "patterns.ja_rhythm_01.label",
      llmGuidance:
        "Flag three or more consecutive sentences ending in the same predicate form (e.g. repeated '〜しています。〜しています。〜しています。') with near-identical length — a documented AI-writing tic in Japanese ('文末が単調'). Vary sentence-final forms and length. Do not force variation onto a passage that is already varied, and do not change the register (です/ます vs である) while varying it.",
      example: {
        before: "観光地は観光客で混雑しています。ホテルはどこも満室です。飲食店も混雑しています。",
        after: "観光地は観光客で混雑しています。朝からホテルのロビーには長い列ができ、飲食店も満席が続いていました。",
      },
    },
    {
      id: "ja-rhythm-02",
      group: "rhythm",
      labelKey: "patterns.ja_rhythm_02.label",
      llmGuidance:
        "Flag the same content restated with slightly different wording ('同義反復'), e.g. '柔軟な対応が必要です。そのためには適応力を高めることが重要です。' where the second sentence adds nothing beyond the first. Preserve genuinely distinct follow-up points.",
      example: {
        before: "柔軟な対応が必要です。そのためには、適応力を高めることが重要です。",
        after: "外国人観光客への対応力を高めるには、まずスタッフ研修を行い、ピーク期は臨時スタッフを導入します。",
      },
    },
    {
      id: "ja-inflation-01",
      group: "inflation",
      labelKey: "patterns.ja_inflation_01.label",
      llmGuidance:
        "Flag vague abstract phrasing with no proper noun, place name, or number where the source could have been concrete ('多くの企業で導入が推進されています', '効果が期待されます'). This is a documented Japanese AI-writing tic ('抽象語の多用・固有名詞の欠如'). Do not invent a specific name or figure that isn't in the source — only flag it; adding fabricated specifics would violate the no-new-facts rule.",
      example: {
        before: "業界全体の成長には、さまざまな課題への対応が求められています。",
        after: "業界の成長には、人材不足と設備更新への対応が求められています。",
      },
    },
    {
      id: "ja-inflation-02",
      group: "inflation",
      labelKey: "patterns.ja_inflation_02.label",
      llmGuidance:
        "Flag weak-causation endings ('〜が重要です。〜が必要です。') stacked without stating why — a documented pattern ('因果関係が弱い'). Preserve when the source text itself only asserts importance without reasoning (don't invent a reason that isn't there); the fix here is usually restructuring, not adding new claims.",
    },
    {
      id: "ja-formatting-01",
      group: "formatting",
      labelKey: "patterns.ja_formatting_01.label",
      llmGuidance:
        "Reduce decorative bold that doesn't aid skimming. Preserve emphasis needed for warnings or long-document navigation.",
    },
    {
      id: "ja-chat-01",
      group: "chat-residue",
      labelKey: "patterns.ja_chat_01.label",
      llmGuidance:
        "Flag customer-service filler ('ご質問ありがとうございます！', 'お役に立てれば幸いです！') with no independent content in stand-alone prose. Preserve such phrasing in actual correspondence or support replies.",
    },
    {
      id: "ja-lang-renkeishi",
      group: "language-specific",
      labelKey: "patterns.ja_lang_renkeishi.label",
      llmGuidance:
        "Flag mechanical overuse of the connector 'これにより' (and similarly 'そのため', 'このように') as a default causal glue between sentences that don't need it — a documented, specifically-called-out Japanese AI-writing tic. Preserve these connectors when the causal or summarizing relationship is real and needed.",
      example: {
        before: "観光客が増加しました。これにより、ホテルの需要が高まりました。これにより、料金も上昇しました。",
        after: "観光客が増加し、ホテルの需要が高まった結果、料金も上昇しました。",
      },
    },
    {
      id: "ja-lang-keyword-repeat",
      group: "language-specific",
      labelKey: "patterns.ja_lang_keyword_repeat.label",
      llmGuidance:
        "Flag the same keyword or key phrase repeated many times within a short passage where a pronoun or omission would read more naturally in Japanese ('キーワードの過剰出現'). Japanese frequently omits the subject/topic once established — repeating the full noun phrase every sentence reads as mechanical. Preserve repetition needed for legal/technical precision.",
    },
    {
      id: "ja-lang-desu-masu-lock",
      group: "language-specific",
      labelKey: "patterns.ja_lang_desu_masu_lock.label",
      llmGuidance:
        "Flag a passage that locks into uniform です/ます register even where the source's own voice (casual, technical, essay-like) would naturally vary sentence endings (体言止め, である調 for technical notes, etc.). This is distinct from ja-rhythm-01 (which is about repeated predicate SHAPE) — this pattern is about register uniformity specifically. Preserve です/ます when the register genuinely calls for consistent politeness (e.g. formal business writing).",
    },
    {
      id: "ja-lang-mitasanai-hikaku",
      group: "language-specific",
      labelKey: "patterns.ja_lang_mitasanai_hikaku.label",
      llmGuidance:
        "Flag near-miss metaphors/comparisons translated or generated in a way that doesn't quite fit Japanese idiom (a direct structural cousin of the English 'almost-landing metaphor' sign) — e.g. a business strategy compared to '楽器を調律する' when the comparison doesn't actually correspond point-by-point. Preserve metaphors that genuinely aid understanding.",
    },
  ],
};
