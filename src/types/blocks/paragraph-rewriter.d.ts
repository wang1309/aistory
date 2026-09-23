import type { Section } from "./section";

export interface ParagraphRewriterPage {
  metadata: { title: string; description: string; keywords: string };
  ui: {
    eyebrow: string; title: string; title_highlight: string; subtitle: string;
    breadcrumb_home: string; breadcrumb_current: string;
    source_text_label: string; source_text_hint: string; character_limit_hint: string;
    goal_label: string; output_language_label: string; output_language_auto: string;
    additional_requirements_label: string; additional_requirements_hint: string;
    ai_model_label: string; generate: string; generating: string; sign_in_to_continue: string;
    result_title: string; output_empty: string; choose_variant: string;
    option_a: string; option_b: string; selected_variant: string;
    original_text: string; rewritten_text: string; changed_text_hint: string;
    copy_result: string; regenerate: string; continue_ai_write: string; continue_hint: string;
  };
  placeholders: { source_text: string; additional_requirements: string };
  goals: Record<"clearer" | "shorter" | "formal" | "natural" | "restructure", string>;
  ai_models: { fast: string; fast_description: string; creative: string; creative_description: string };
  validation: { enter_source_text: string; source_text_too_long: string; requirements_too_long: string };
  success: { result_copied: string };
  errors: { generation_failed: string; copy_failed: string };
  feature_intro?: Section; how_to_use?: Section; feature_benefits?: Section;
  feature_section?: Section; faq_section?: Section; cta_section?: Section;
  related_tools: { title: string; description: string; more_label: string };
}
