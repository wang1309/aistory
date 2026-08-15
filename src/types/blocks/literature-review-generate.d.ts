import { Section } from "./section";

export interface LiteratureReviewGenerate {
  metadata?: {
    title: string;
    description: string;
    keywords: string;
  };
  ui: {
    title: string;
    title_accent: string;
    subtitle: string;
    eyebrow: string;
    breadcrumb_home: string;
    breadcrumb_current: string;
    integrity_note_title: string;
    integrity_note: string;
    disclosure: string;
    value_points: {
      title: string;
      description: string;
    }[];
    topic_label: string;
    topic_hint: string;
    random_button: string;
    research_question_label: string;
    assignment_brief_label: string;
    discipline_label: string;
    themes_sources_label: string;
    themes_sources_hint: string;
    ai_model: string;
    output_language: string;
    academic_level: string;
    review_length: string;
    tone: string;
    advanced_options: string;
    generate_button: string;
    generating: string;
    sign_in_to_continue: string;
  };
  placeholders: {
    topic: string;
    research_question: string;
    assignment_brief: string;
    discipline: string;
    themes_sources: string;
  };
  random_prompts: string[];
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  academic_levels: Record<string, string>;
  review_lengths: Record<string, string>;
  tones: Record<string, string>;
  validation: {
    enter_topic: string;
    topic_too_long: string;
    select_model: string;
  };
  success: {
    random_topic_selected: string;
    review_generated: string;
    review_copied: string;
    saved_locally: string;
  };
  errors: {
    generation_failed: string;
  };
  output: {
    title: string;
    words: string;
    copy: string;
    export: string;
    export_md: string;
    export_txt: string;
    generating_message: string;
    empty_message: string;
    evidence_warning_title: string;
    evidence_warning: string;
  };
  completion_guide?: {
    title: string;
    subtitle: string;
    create_another: string;
    share_action: string;
    continue_label: string;
  };
  feature_intro?: Section;
  example_section?: Section;
  source_responsibility?: Section;
  how_to_use?: Section;
  feature_section?: Section;
  faq_section?: Section;
  cta_section?: Section;
}
