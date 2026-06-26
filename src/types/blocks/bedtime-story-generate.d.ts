import { Section } from "./section";

export interface BedtimeStoryGenerate {
  metadata?: {
    title: string;
    description: string;
    keywords: string;
  };
  ui: {
    title: string;
    subtitle: string;
    breadcrumb_home: string;
    breadcrumb_current: string;
    story_idea: string;
    random_button: string;
    ai_model: string;
    output_language: string;
    age_group: string;
    story_theme: string;
    story_length: string;
    ending_mood: string;
    moral_lesson: string;
    child_name: string;
    advanced_options: string;
    generate_button: string;
    generating: string;
    theme_pills?: string[];
    output_title: string;
  };
  placeholders: {
    story_idea: string;
    child_name: string;
  };
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  age_groups: Record<string, string>;
  story_themes: Record<string, string>;
  story_lengths: Record<string, string>;
  ending_moods: Record<string, string>;
  moral_lessons: Record<string, string>;
  validation: {
    enter_story_idea: string;
    select_model: string;
  };
  success: {
    random_prompt_selected: string;
    story_generated: string;
    story_copied: string;
  };
  errors: {
    generation_failed: string;
  };
  output: {
    title: string;
    words: string;
    copy: string;
    continue_button: string;
    generating_message: string;
    empty_message: string;
  };
  random_prompts: string[];
  feature_intro?: Section;
  feature_benefits?: Section;
  feature_section?: Section;
  faq_section?: Section;
  cta_section?: Section;
  how_to_use?: Section;
}
