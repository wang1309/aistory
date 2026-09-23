import type { HumanizerLanguagePack } from "./humanizer-patterns";

/**
 * Ported from .claude/skills/humanizer-zh/SKILL.md (31 patterns, groups A-F).
 * llmGuidance is written in English because it is spliced directly into the
 * LLM prompt; example pairs keep the original Chinese wording from the skill.
 */
export const HUMANIZER_PATTERNS_ZH: HumanizerLanguagePack = {
  lang: "zh",
  toneNote:
    "保留原文的语域和语气(随笔口语化 vs 技术文档正式化 vs 商务学术庄重)，不要把所有输入拉平成同一种中性讲解腔。自然连接词(首先/与此同时/不过)有实际逻辑作用时不要因为追求短句而删除或拆散，也不要为了变化句长硬拆或合并本来通顺的句子。",
  patterns: [
    {
      id: "zh-a1",
      group: "padding",
      labelKey: "patterns.zh_a1.label",
      llmGuidance:
        "Flag false-contrast openers like '这不仅是……更是……' that only inflate tone without adding information. Do NOT flag genuine contrasts where both parts carry information, or where the negated part corrects a real misunderstanding.",
      example: {
        before: "这不仅是一个导出按钮，更是通往高效工作的全新入口。它可以导出 CSV。",
        after: "这个按钮可以导出 CSV。",
      },
    },
    {
      id: "zh-a2",
      group: "padding",
      labelKey: "patterns.zh_a2.label",
      llmGuidance:
        "Flag dramatic one-sentence fragments that merely repeat the same point for effect. Do NOT flag short sentences that carry a new fact or a deliberate emphasis.",
      example: {
        before: "文件没了。消失了。再也找不到了。我们没有备份。",
        after: "文件丢失了，我们没有备份。",
      },
    },
    {
      id: "zh-a3",
      group: "padding",
      labelKey: "patterns.zh_a3.label",
      llmGuidance:
        "Flag epigram/aphorism-style rhetoric that adds no meaning beyond a concrete point already in the text. Do NOT flag quoted or analyzed aphorisms, or metaphors the author uses deliberately to aid understanding.",
      example: {
        before: "协作是效率的语言。这里的协作，是指两名编辑共同核对同一份清单。",
        after: "这里的协作是两名编辑共同核对同一份清单。",
      },
    },
    {
      id: "zh-a4",
      group: "padding",
      labelKey: "patterns.zh_a4.label",
      llmGuidance:
        "Flag throat-clearing openers ('让我们深入看看…', '以下是你需要知道的…') that only preview what follows. Do NOT fill the deleted space with new content, and do NOT flag genuine hesitation/reflection the author intends ('说实话，我还没想好').",
      example: {
        before: "接下来让我们深入看看缓存的作用。缓存可以复用已经取得的结果。",
        after: "缓存可以复用已经取得的结果。",
      },
    },
    {
      id: "zh-a5",
      group: "padding",
      labelKey: "patterns.zh_a5.label",
      llmGuidance:
        "Flag self-defensive hedging against an imaginary objection ('不要误会，我不是在制造焦虑') with no concrete content. Do NOT flag real caveats, limitations, or alternatives the reader would actually need to weigh.",
      example: {
        before: "不要误会，我并不是在制造焦虑。我想说的是，删除前需要确认备份是否存在。",
        after: "删除前需要确认备份是否存在。",
      },
    },
    {
      id: "zh-b6",
      group: "rhythm",
      labelKey: "patterns.zh_b6.label",
      llmGuidance:
        "Flag forced rule-of-three lists where items are redundant or vague. Check each item for independent information first; merge only if genuinely repetitive — do not force a fixed item count or invent a fourth item.",
      example: {
        before: "这次更新带来了创新、突破和全新的可能。它新增导出、搜索和批量重命名。",
        after: "这次更新新增导出、搜索和批量重命名。",
      },
    },
    {
      id: "zh-b7",
      group: "rhythm",
      labelKey: "patterns.zh_b7.label",
      llmGuidance:
        "Flag consecutive sentences that repeat the same subject purely for cadence. Merge only when repetition is dragging, preserving each action and its time order. Do NOT flag deliberate parallelism.",
      example: {
        before: "她检查了门。她检查了门上的锁。随后，她记下了两处问题。",
        after: "她检查了门和门上的锁，随后记下了两处问题。",
      },
    },
    {
      id: "zh-b8",
      group: "rhythm",
      labelKey: "patterns.zh_b8.label",
      llmGuidance:
        "Flag em-dashes used repeatedly as a suspense device or to paper over unclear clause relationships. Preserve em-dashes that genuinely explain, insert an aside, or mark a real turn — do not remove them just because no author-voice sample says otherwise.",
      example: {
        before: "结果终于出现了——答案揭晓了——文件无法导出。",
        after: "结果是文件无法导出。",
      },
    },
    {
      id: "zh-b9",
      group: "rhythm",
      labelKey: "patterns.zh_b9.label",
      llmGuidance:
        "Flag stacked hedges expressing the same uncertainty layer twice (e.g. '也许可能会'). Preserve genuine distinct qualifiers (e.g. scope vs. evidence strength) even if adjacent, and preserve legal/precision caveats.",
      example: {
        before: "在缓存开启的情况下，这项调整也许可能会减少读取时间，目前尚未验证。",
        after: "缓存开启时，这项调整可能减少读取时间，目前尚未验证。",
      },
    },
    {
      id: "zh-b10",
      group: "rhythm",
      labelKey: "patterns.zh_b10.label",
      llmGuidance:
        "Flag invented compound labels/hyphenated jargon that obscure meaning ('文稿-校对-发布一体化机制') when a plain description already exists. Preserve established fixed terms (e.g. '端到端加密') even if they look similar.",
      example: {
        before: "我们采用“文稿-校对-发布一体化”机制，也就是在同一个页面完成写稿、校对和发布。",
        after: "我们在同一个页面完成写稿、校对和发布。",
      },
    },
    {
      id: "zh-b11",
      group: "rhythm",
      labelKey: "patterns.zh_b11.label",
      llmGuidance:
        "Flag passive-voice/missing-subject constructions when the actor is known and stating it actively would be clearer. Preserve passive voice when the actor is genuinely unknown, unimportant, or required by register — do not invent a subject like '系统' or '研究人员'.",
      example: {
        before: "这份稿件被编辑复核后，编辑将其退回。",
        after: "编辑复核这份稿件后将其退回。",
      },
    },
    {
      id: "zh-c12",
      group: "inflation",
      labelKey: "patterns.zh_c12.label",
      llmGuidance:
        "Flag hollow use of high-frequency AI vocabulary ('赋能/至关重要/深入探讨/无缝/闭环') only when vague, redundant, or imprecise. Do not flag precise formal/engineering usage of the same words (e.g. '闭环反馈').",
      example: {
        before: "本文将深入探讨一个至关重要的问题：导出失败后如何重试。",
        after: "本文讨论导出失败后如何重试。",
      },
    },
    {
      id: "zh-c13",
      group: "inflation",
      labelKey: "patterns.zh_c13.label",
      llmGuidance:
        "Flag grandiose framing ('标志着……新时代的到来') with no independent content. Preserve real plans, difficulties, timelines, and judgments the author explicitly states, even inside the same sentence.",
      example: {
        before: "团队在周三开放了文件导出，标志着协作新时代的到来。离线编辑仍在开发。",
        after: "团队在周三开放了文件导出。离线编辑仍在开发。",
      },
    },
    {
      id: "zh-c14",
      group: "inflation",
      labelKey: "patterns.zh_c14.label",
      llmGuidance:
        "When the source text already states a role or relationship explicitly, state it directly instead of a vague link phrase ('与……有着密切联系'). If the source itself is vague, preserve that vagueness — do not infer or invent the specific role.",
      example: {
        before: "他与该乐团有着密切联系，具体来说，他负责乐团的票务。",
        after: "他负责该乐团的票务。",
      },
    },
    {
      id: "zh-c15",
      group: "inflation",
      labelKey: "patterns.zh_c15.label",
      llmGuidance:
        "Flag sentence-final inflation tails ('……彰显了团队对创新的不懈追求') that only restate praise. Preserve trailing clauses that carry a real reason, purpose, or result.",
      example: {
        before: "页面提供全文搜索，彰显了团队对创新的不懈追求。",
        after: "页面提供全文搜索。",
      },
    },
    {
      id: "zh-c16",
      group: "inflation",
      labelKey: "patterns.zh_c16.label",
      llmGuidance:
        "Reduce content-free promotional praise ('堪称……的梦想天堂'), keeping only features the source actually provides. Do not invent specs; keep subjective author opinions as opinions, not as objective rankings.",
      example: {
        before: "这家咖啡馆位于杭州市中心，装修有特色，堪称咖啡爱好者的梦想天堂。",
        after: "这家咖啡馆位于杭州市中心，装修有特色。",
      },
    },
    {
      id: "zh-c17",
      group: "inflation",
      labelKey: "patterns.zh_c17.label",
      llmGuidance:
        "Never replace vague attribution ('一些专家认为') with invented named institutions, reports, or dates. Preserve the vagueness and the claim's uncertainty; do not upgrade an attributed opinion into a stated fact.",
      example: {
        before: "一些未具名的专家认为，这一设计可能减少误操作，充分体现了其重大价值。",
        after: "一些未具名的专家认为，这一设计可能减少误操作。",
      },
    },
    {
      id: "zh-c18",
      group: "inflation",
      labelKey: "patterns.zh_c18.label",
      llmGuidance:
        "May streamline copula ('是/有') sentences for flow, but preserve quantities, comparisons, and scope exactly ('超过' is not '等于'; '可以提供' is not 'already provided').",
      example: {
        before: "这个空间作为展览场地，设有四个独立展区，总面积超过 3000 平方英尺。",
        after: "这个空间是展览场地，有四个独立展区，总面积超过 3000 平方英尺。",
      },
    },
    {
      id: "zh-d19",
      group: "formatting",
      labelKey: "patterns.zh_d19.label",
      llmGuidance:
        "Reduce decorative bold that doesn't aid skimming. Preserve emphasis needed for warnings/long-document navigation, and do not strip parenthetical explanations or list items just because bold was removed.",
      example: {
        before: "支持 **CSV（逗号分隔值）** 和 **JSON** 导出。",
        after: "支持 CSV（逗号分隔值）和 JSON 导出。",
      },
    },
    {
      id: "zh-d20",
      group: "formatting",
      labelKey: "patterns.zh_d20.label",
      llmGuidance:
        "Adjust decorative emoji/arrows/dividers in headings when they hinder reading. Structure itself is not the problem; preserve arrows that carry real process meaning.",
      example: {
        before: "🚀 发布安排：产品计划在第三季度发布。",
        after: "发布安排：产品计划在第三季度发布。",
      },
    },
    {
      id: "zh-d21",
      group: "formatting",
      labelKey: "patterns.zh_d21.label",
      llmGuidance:
        "Normalize quotation marks/punctuation to match the target format (e.g. straight quotes to Chinese curly quotes in prose). Preserve quotes inside code/JSON strings and user-specified punctuation styles.",
      example: {
        before: "他说\"项目进展顺利\"，但其他人不同意。",
        after: "他说“项目进展顺利”，但其他人不同意。",
      },
    },
    {
      id: "zh-e22",
      group: "chat-residue",
      labelKey: "patterns.zh_e22.label",
      llmGuidance:
        "In stand-alone articles, remove content-free greetings/praise/offers ('好问题！...希望这对您有帮助！'), keeping the real information they wrap. Preserve such courtesy in actual emails/letters/support replies.",
      example: {
        before: "好问题！这是导出功能的说明。它支持 CSV。希望这对您有帮助！",
        after: "导出功能支持 CSV。",
      },
    },
    {
      id: "zh-e23",
      group: "chat-residue",
      labelKey: "patterns.zh_e23.label",
      llmGuidance:
        "Remove repeated knowledge-boundary disclaimers, but never hide a real information gap or convert a guess into a stated fact. If the author already flagged something as a guess, keep it as a guess.",
      example: {
        before: "现有材料没有记载公司的成立日期。关于这一点，可用信息确实比较有限。",
        after: "现有材料没有记载公司的成立日期。",
      },
    },
    {
      id: "zh-e24",
      group: "chat-residue",
      labelKey: "patterns.zh_e24.label",
      llmGuidance:
        "Remove only the restated sentence that echoes a heading with no independent meaning. Preserve conditions/definitions/data that follow the heading even if wording overlaps.",
      example: {
        before: "本节介绍导出限制。下面说明导出限制。单个文件最大为 10 MB。",
        after: "本节介绍导出限制。单个文件最大为 10 MB。",
      },
    },
    {
      id: "zh-e25",
      group: "chat-residue",
      labelKey: "patterns.zh_e25.label",
      llmGuidance:
        "Remove meta-commentary about the editing process itself ('这一段是刚补充的说明'). Preserve genuine changelog/release-note content that documents a real before/after difference.",
      example: {
        before: "这一段是刚补充的说明，内容是文件最大为 10 MB。",
        after: "文件最大为 10 MB。",
      },
    },
    {
      id: "zh-f26",
      group: "language-specific",
      labelKey: "patterns.zh_f26.label",
      llmGuidance:
        "Flag long chains of nested '的'-modifiers that hurt readability. Restructure the sentence, but preserve every modifying relationship — do not drop a modifier to shorten it.",
      example: {
        before: "这是一个十亿参数的开源小模型的微调的完整方案。",
        after: "这是一套完整的微调方案，适用于一个十亿参数的开源小模型。",
      },
    },
    {
      id: "zh-f27",
      group: "language-specific",
      labelKey: "patterns.zh_f27.label",
      llmGuidance:
        "Flag verbose '进行+verb' constructions ('进行全面测试') where a direct verb reads better. Preserve tense/aspect distinctions ('正在测试' is not '测试了') and formal-register cases where '进行' reads naturally.",
      example: {
        before: "我们正在对系统进行全面测试，并计划在周五进行配置调整。",
        after: "我们正在全面测试系统，并计划在周五调整配置。",
      },
    },
    {
      id: "zh-f28",
      group: "language-specific",
      labelKey: "patterns.zh_f28.label",
      llmGuidance:
        "Flag stacked 被-passive constructions across consecutive clauses. When rewriting to active voice, preserve attribution and certainty exactly — '被认为有关' is not the same claim as '导致'. Do not assume the reporter is also the one who proposed the cause.",
      example: {
        before: "该问题被社区多次报告，被认为可能与内存泄漏有关，但原因尚未确认。",
        after: "社区多次报告这个问题。它被认为可能与内存泄漏有关，但原因尚未确认。",
      },
    },
    {
      id: "zh-f29",
      group: "language-specific",
      labelKey: "patterns.zh_f29.label",
      llmGuidance:
        "Only address four-character idiom strings when they are vague, synonymous padding, or mismatched with the register — four-character rhythm itself is not an error. Do not invent metrics when the source has no data.",
      example: {
        before: "该方案稳定可靠、快速响应、易于维护。",
        after: "这套方案运行稳定、响应快，也方便维护。",
      },
    },
    {
      id: "zh-f30",
      group: "language-specific",
      labelKey: "patterns.zh_f30.label",
      llmGuidance:
        "Compress '随着……的发展' background openers only when the background carries no independent information. Preserve real trend/timing background and genuine causal relationships.",
      example: {
        before: "在技术不断发展的时代背景下，本文讨论文稿校对。",
        after: "本文讨论文稿校对。",
      },
    },
    {
      id: "zh-f31",
      group: "language-specific",
      labelKey: "patterns.zh_f31.label",
      llmGuidance:
        "Remove content-free closing wishes/repeated praise ('让我们拭目以待'). Preserve real summaries, sentiment, and stated next steps — do not invent a next step the author didn't state.",
      example: {
        before: "总而言之，让我们拭目以待，期待更多可能。团队计划在周五继续测试。",
        after: "团队计划在周五继续测试。",
      },
    },
  ],
};
