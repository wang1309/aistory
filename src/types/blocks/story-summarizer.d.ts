import type { Section } from "./section";

export interface StorySummarizerPage {
  metadata: { title: string; description: string; keywords: string };
  ui: {
    eyebrow: string; title: string; title_highlight: string; subtitle: string;
    breadcrumb_home: string; breadcrumb_current: string;
    story_text_label: string; story_text_hint: string; character_limit_hint: string;
    summary_length_label: string; spoiler_mode_label: string;
    ai_model_label: string;
    output_language_label: string; output_language_auto: string;
    generate: string; generating: string; sign_in_to_continue: string; output_empty: string; copy_result: string;
    result_title: string; summary: string; plot_beats: string;
    characters: string; character_role: string; character_change: string;
    themes: string; central_conflict: string;
    continue_ai_write: string; continue_hint: string;
  };
  placeholders: { story_text: string };
  ai_models: {
    fast: string; fast_description: string;
    creative: string; creative_description: string;
  };
  summary_lengths: Record<"50" | "150" | "500", string>;
  spoiler_modes: Record<"full" | "premise", string>;
  validation: { enter_story_text: string; story_text_too_long: string };
  success: { result_copied: string };
  errors: { generation_failed: string; copy_failed: string };
  feature_intro?: Section;
  how_to_use?: Section;
  feature_benefits?: Section;
  feature_section?: Section;
  faq_section?: Section;
  cta_section?: Section;
  related_tools: { title: string; description: string; more_label: string };
}
