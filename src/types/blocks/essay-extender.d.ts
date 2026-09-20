import type { Section } from "./section";

export interface EssayExtenderPage {
  metadata: { title: string; description: string; keywords: string };
  ui: {
    eyebrow: string; title: string; title_highlight: string; subtitle: string;
    breadcrumb_home: string; breadcrumb_current: string;
    source_text_label: string; source_text_hint: string; character_limit_hint: string;
    target_word_count_label: string; target_word_count_hint: string;
    target_shortcuts: number[];
    tone_label: string; focus_label: string;
    tone_options: { value: string; label: string }[];
    focus_options: { value: string; label: string }[];
    additional_requirements_label: string; additional_requirements_hint: string;
    ai_model_label: string;
    output_language_label: string; output_language_auto: string;
    generate: string; generating: string; sign_in_to_continue: string;
    output_empty: string; copy_result: string;
    result_title: string;
    actual_word_count: string; target_word_count: string; added_word_count: string;
    continue_ai_write: string; continue_hint: string;
  };
  placeholders: { source_text: string; additional_requirements: string };
  ai_models: {
    fast: string; fast_description: string;
    creative: string; creative_description: string;
  };
  validation: {
    enter_source_text: string; source_text_too_long: string;
    requirements_too_long: string; invalid_target_word_count: string;
  };
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
