import type { Section } from "./section";

export interface RapLyricOption {
  value: string;
  label: string;
}

export interface RapLyricGeneratorPage {
  metadata: { title: string; description: string; keywords: string };
  ui: {
    eyebrow: string;
    title: string;
    title_highlight: string;
    subtitle: string;
    breadcrumb_home: string;
    breadcrumb_current: string;
    topic_label: string;
    topic_hint: string;
    character_limit_hint: string;
    topic_examples_label: string;
    topic_examples: string[];
    format_label: string;
    style_label: string;
    content_rating_label: string;
    rhyme_density_label: string;
    language_label: string;
    format_options: RapLyricOption[];
    style_options: RapLyricOption[];
    content_rating_options: RapLyricOption[];
    rhyme_density_options: RapLyricOption[];
    ai_model_label: string;
    generate: string;
    generating: string;
    sign_in_to_continue: string;
    result_title: string;
    output_empty: string;
    safety_note: string;
    status_idle: string;
    status_writing: string;
    status_done: string;
    copy_result: string;
    regenerate: string;
    reset: string;
    line_count: string;
  };
  placeholders: { topic: string };
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  validation: { enter_topic: string; topic_too_long: string };
  success: { result_copied: string };
  errors: { generation_failed: string; no_content: string; copy_failed: string };
  feature_intro?: Section;
  how_to_use?: Section;
  feature_benefits?: Section;
  formats_section?: Section;
  craft_section?: Section;
  feature_section?: Section;
  faq_section?: Section;
  cta_section?: Section;
  related_tools: { title: string; description: string; more_label: string };
}
