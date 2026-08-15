export type LiteratureReviewLevel = "undergraduate" | "masters";

export type LiteratureReviewLength = "short" | "medium" | "long";

export type LiteratureReviewTone = "neutral" | "formal" | "accessible";

export interface LiteratureReviewInput {
  topic: string;
  researchQuestion?: string;
  assignmentBrief?: string;
  discipline?: string;
  themesOrSources?: string;
  academicLevel: LiteratureReviewLevel;
  reviewLength: LiteratureReviewLength;
  tone: LiteratureReviewTone;
  locale: string;
}

export const LITERATURE_REVIEW_LIMITS = {
  topic: 300,
  researchQuestion: 300,
  assignmentBrief: 600,
  discipline: 120,
  themesOrSources: 3000,
} as const;

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  de: "German",
  ru: "Russian",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  it: "Italian",
};

const LEVEL_GUIDE: Record<LiteratureReviewLevel, string> = {
  undergraduate:
    "Final-year undergraduate coursework — clear, well-organised prose that shows understanding of the field without pretending to expert command of it.",
  masters:
    "Master's coursework — more analytical synthesis, sharper critical evaluation of the literature, and clearer positioning of gaps.",
};

const LENGTH_GUIDE: Record<LiteratureReviewLength, string> = {
  short:
    "Short — approximately 800 words. A compact review: brief introduction, two or three themes, tensions/gaps, short conclusion.",
  medium:
    "Medium — approximately 1500 words. A full chapter-style review: introduction, three or four themes developed in depth, tensions/gaps, conclusion.",
  long:
    "Long — approximately 2500 words. An extended review: introduction, four or five themes with detailed synthesis, tensions/gaps, conclusion with directions for further work.",
};

const TONE_GUIDE: Record<LiteratureReviewTone, string> = {
  neutral: "Neutral academic voice — measured, precise, hedged where evidence is unclear.",
  formal: "Formal academic register — impersonal constructions, disciplined terminology, no contractions.",
  accessible:
    "Accessible academic voice — clear and readable while remaining scholarly; avoid unnecessary jargon.",
};

export interface ParsedLiteratureReviewInput {
  ok: boolean;
  error?: string;
  value?: LiteratureReviewInput;
}

/**
 * Server-side validation and normalisation. Returns an error message for a
 * missing topic or any over-long field so the route can reject before any
 * provider call. Unknown enum values fall back to defaults rather than
 * failing, mirroring the tolerant behaviour of sibling generators.
 */
export function parseLiteratureReviewInput(raw: {
  topic?: string;
  researchQuestion?: string;
  assignmentBrief?: string;
  discipline?: string;
  themesOrSources?: string;
  academicLevel?: string;
  reviewLength?: string;
  tone?: string;
  locale?: string;
}): ParsedLiteratureReviewInput {
  const topic = (raw.topic || "").trim();
  if (!topic) return { ok: false, error: "Please provide a research topic" };
  if (topic.length > LITERATURE_REVIEW_LIMITS.topic)
    return { ok: false, error: "Research topic is too long" };

  const optional: Array<[string | undefined, number, string]> = [
    [raw.researchQuestion, LITERATURE_REVIEW_LIMITS.researchQuestion, "Research question is too long"],
    [raw.assignmentBrief, LITERATURE_REVIEW_LIMITS.assignmentBrief, "Assignment brief is too long"],
    [raw.discipline, LITERATURE_REVIEW_LIMITS.discipline, "Discipline is too long"],
    [raw.themesOrSources, LITERATURE_REVIEW_LIMITS.themesOrSources, "Sources and notes are too long"],
  ];
  for (const [field, limit, message] of optional) {
    if (field && field.trim().length > limit) return { ok: false, error: message };
  }

  const academicLevel: LiteratureReviewLevel =
    raw.academicLevel === "masters" ? "masters" : "undergraduate";
  const reviewLength: LiteratureReviewLength =
    raw.reviewLength === "short" || raw.reviewLength === "long" ? raw.reviewLength : "medium";
  const tone: LiteratureReviewTone =
    raw.tone === "formal" || raw.tone === "accessible" ? raw.tone : "neutral";

  return {
    ok: true,
    value: {
      topic,
      researchQuestion: raw.researchQuestion?.trim() || "",
      assignmentBrief: raw.assignmentBrief?.trim() || "",
      discipline: raw.discipline?.trim() || "",
      themesOrSources: raw.themesOrSources?.trim() || "",
      academicLevel,
      reviewLength,
      tone,
      locale: raw.locale || "en",
    },
  };
}

export function hasSuppliedSources(input: LiteratureReviewInput): boolean {
  return Boolean(input.themesOrSources && input.themesOrSources.trim().length > 0);
}

/**
 * Builds the narrative literature-review prompt. Core academic-integrity
 * contract (unit-tested): treat pasted material as context only, never invent
 * bibliographic details, mark unsupported claims, and never claim systematic
 * review methodology or completeness.
 */
export function buildLiteratureReviewPrompt(input: LiteratureReviewInput): string {
  const outputLanguage = LANGUAGE_NAMES[input.locale] || LANGUAGE_NAMES.en;
  const suppliedSources = (input.themesOrSources || "").trim();
  const supplied = suppliedSources.length > 0;

  const lines: string[] = [
    "Draft a narrative literature review structure and draft text for the student request below. You are a drafting aid, not a search engine.",
    "",
    "## Assignment Context",
    `- Research topic: ${input.topic}`,
  ];
  if (input.researchQuestion) lines.push(`- Research question: ${input.researchQuestion}`);
  if (input.discipline) lines.push(`- Discipline: ${input.discipline}`);
  if (input.assignmentBrief) lines.push(`- Assignment brief / requirements: ${input.assignmentBrief}`);
  lines.push(`- Academic level: ${LEVEL_GUIDE[input.academicLevel]}`);
  lines.push(`- Tone: ${TONE_GUIDE[input.tone]}`);

  if (supplied) {
    lines.push(
      "",
      "## User-Supplied Themes, Sources and Notes (context only)",
      suppliedSources,
      "",
      "Treat the material above strictly as user-provided context. You may refer to works the user listed, but only with the details they gave — never add authors, years, DOIs, page numbers, quotes, or findings from memory."
    );
  }

  lines.push(
    "",
    "## Required Structure",
    "Use Markdown with these sections:",
    "1. `## Introduction` — scope of the review, how the field is organised, and how the themes below were chosen.",
    "2. `## Thematic Synthesis` — organise the body by themes (use `### Theme:` sub-headings), synthesising and comparing perspectives instead of listing paper-by-paper.",
    "3. `## Tensions and Gaps` — disagreements, open questions, and under-researched areas.",
    "4. `## Conclusion` — what the balance of the supplied context suggests and what a reader should take away.",
    "5. `## Evidence to Verify` — a checklist of every claim in the draft that still needs a real source, phrased so the student can search for it. If no sources were supplied, every factual claim about specific studies belongs here.",
    "",
    "## Length and Language",
    LENGTH_GUIDE[input.reviewLength],
    `- Output language: ${outputLanguage}`,
    "",
    "## Academic Integrity Rules (STRICT)",
    "- NEVER invent bibliographic details: no fabricated citations, author-year references, DOIs, page numbers, direct quotes, or specific study findings.",
    supplied
      ? "- Confine any references to works the user actually supplied above; keep only the details they provided and mark anything incomplete as needing verification."
      : "- The user supplied NO sources, so do not cite or name any specific studies anywhere — label evidence needs instead.",
    "- Mark unsupported claims inline with `[source needed]` so the student can find and verify them.",
    "- Do NOT claim systematic-review methodology, completeness, or exhaustive coverage. This is a narrative review draft.",
    "- Write synthesized, hedged academic prose the student can verify, revise, and support with their own sources.",
  );

  return lines.join("\n");
}
