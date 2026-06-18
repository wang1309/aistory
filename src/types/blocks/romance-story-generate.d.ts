import { Section } from "./section";

export interface RomanceStoryGenerate {
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
    sub_genre: string;
    trope: string;
    heat_level: string;
    setting: string;
    advanced_options: string;
    pov: string;
    story_length: string;
    generate_button: string;
    generating: string;
    trope_pills?: string[];
    output_title: string;
  };
  placeholders: {
    story_idea: string;
  };
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  sub_genres: Record<string, string>;
  tropes: Record<string, string>;
  heat_levels: Record<string, string>;
  settings: Record<string, string>;
  povs: Record<string, string>;
  story_lengths: Record<string, string>;
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
