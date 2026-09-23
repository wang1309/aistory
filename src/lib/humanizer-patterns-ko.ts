import type { HumanizerLanguagePack } from "./humanizer-patterns";

/**
 * v1 Korean pack. General categories mirror the same structural problems
 * as zh/en/ja; "language-specific" seeds from concrete, sourced Korean
 * AI-writing fingerprints (번역투 문장, 격식체 잠금, 존댓말/반말 혼용 붕괴)
 * documented in Korean-language commentary on detecting AI-generated text
 * (see plan follow-up, 2026-09 research pass), not translated from the
 * other packs.
 */
export const HUMANIZER_PATTERNS_KO: HumanizerLanguagePack = {
  lang: "ko",
  toneNote:
    "문장 끝맺음에 변화를 주어라 — '~습니다', '~합니다'가 세 문장 이상 연속되면 단조롭고 기계적으로 들린다. 원문의 격식 수준(합니다체, 해요체, 반말, 구어체)은 그대로 유지하고, 모든 문장을 중립적인 격식체로 평평하게 만들지 마라. 고유명사, 수치, 구체적 사실은 그대로 남기고 추상적인 표현으로 바꾸지 마라. 감정이나 입장이 드러난 원문의 어조를 지워서 무색무취하게 만들지 마라.",
  patterns: [
    {
      id: "ko-padding-01",
      group: "padding",
      labelKey: "patterns.ko_padding_01.label",
      llmGuidance:
        "Flag generic scene-setting openers ('최근 ~에 대한 관심이 높아지고 있습니다') with no independent content. Preserve when the background carries a specific fact (a date, a named trend) the argument depends on.",
    },
    {
      id: "ko-padding-02",
      group: "padding",
      labelKey: "patterns.ko_padding_02.label",
      llmGuidance:
        "Flag '이것은 단순히 ~가 아니라, ~입니다' false-elevation openers that inflate tone without adding information. Preserve genuine contrasts that correct a real misunderstanding.",
    },
    {
      id: "ko-rhythm-01",
      group: "rhythm",
      labelKey: "patterns.ko_rhythm_01.label",
      llmGuidance:
        "Flag three or more consecutive sentences ending in the same predicate ending (repeated '~습니다.' / '~합니다.') with near-identical length and structure — a documented AI-writing tic in Korean, mirroring the low-burstiness problem seen across languages. Vary sentence-final forms and length. Do not change the underlying formality register (합니다체 vs 해요체) while varying it — only vary rhythm within the same register.",
    },
    {
      id: "ko-rhythm-02",
      group: "rhythm",
      labelKey: "patterns.ko_rhythm_02.label",
      llmGuidance:
        "Flag the same point restated with slightly different wording where the second sentence adds nothing beyond the first ('유연한 대응이 필요합니다. 그러기 위해서는 적응력을 높이는 것이 중요합니다.'). Preserve genuinely distinct follow-up points.",
    },
    {
      id: "ko-inflation-01",
      group: "inflation",
      labelKey: "patterns.ko_inflation_01.label",
      llmGuidance:
        "Flag vague abstract phrasing with no proper noun or number where the source could have been concrete ('다양한 노력이 요구됩니다', '효과가 기대됩니다'). Do not invent a specific name or figure that isn't in the source — only flag it; the fix is usually restructuring around what IS specific in the source, not adding fabricated specifics.",
    },
    {
      id: "ko-inflation-02",
      group: "inflation",
      labelKey: "patterns.ko_inflation_02.label",
      llmGuidance:
        "Flag weak-causation endings ('~이 중요합니다. ~이 필요합니다.') stacked without stating why. Preserve when the source itself only asserts importance without reasoning — restructure, don't invent a reason that isn't there.",
    },
    {
      id: "ko-formatting-01",
      group: "formatting",
      labelKey: "patterns.ko_formatting_01.label",
      llmGuidance:
        "Reduce decorative bold that doesn't aid skimming. Preserve emphasis needed for warnings or long-document navigation.",
    },
    {
      id: "ko-chat-01",
      group: "chat-residue",
      labelKey: "patterns.ko_chat_01.label",
      llmGuidance:
        "Flag customer-service filler ('좋은 질문입니다!', '도움이 되었으면 좋겠습니다!') with no independent content in stand-alone prose. Preserve such phrasing in actual correspondence or support replies.",
    },
    {
      id: "ko-lang-beonyeoktu",
      group: "language-specific",
      labelKey: "patterns.ko_lang_beonyeoktu.label",
      llmGuidance:
        "Flag '번역투' — sentence structures that read as a direct translation of English logical structure rather than natural Korean phrasing (e.g. over-explicit subject-object ordering, English-style relative clauses stacked before the noun). This is a documented, specifically-named Korean AI-writing tic caused by English-dominant training data. Preserve technical/legal register where explicit structure is expected.",
    },
    {
      id: "ko-lang-hyeongsik-lock",
      group: "language-specific",
      labelKey: "patterns.ko_lang_hyeongsik_lock.label",
      llmGuidance:
        "Flag a passage that locks into uniformly formal, neutral tone (과도하게 격식적이며 중립적인 톤) even where the source's own voice is casual, emotional, or opinionated — a documented Korean AI-writing tic distinct from ko-rhythm-01 (which is about repeated sentence-ending SHAPE, not overall register flatness). Preserve genuine formal register where the content calls for it (business, academic, legal).",
    },
    {
      id: "ko-lang-jondaemal-mismatch",
      group: "language-specific",
      labelKey: "patterns.ko_lang_jondaemal_mismatch.label",
      llmGuidance:
        "Flag inconsistent honorific level within a passage — mixing 존댓말 (formal/polite) and 반말 (casual) without a reason the source establishes, or switching honorific level for the same referent inconsistently. Preserve intentional honorific shifts the source uses for characterization or quoted dialogue.",
    },
    {
      id: "ko-lang-keyword-repeat",
      group: "language-specific",
      labelKey: "patterns.ko_lang_keyword_repeat.label",
      llmGuidance:
        "Flag the same keyword or key noun phrase repeated many times within a short passage where omission (Korean frequently drops an already-established subject/topic) or a pronoun would read more naturally. Preserve repetition needed for legal/technical precision.",
    },
  ],
};
