import { Section } from "./section";

export interface MurderMysteryGenerate {
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
    scenario_idea: string;
    random_button: string;
    ai_model: string;
    output_language: string;
    setting_type: string;
    time_period: string;
    player_count: string;
    complexity: string;
    mystery_type: string;
    tone: string;
    advanced_options: string;
    generate_button: string;
    generating: string;
    hero_step_1: string;
    hero_step_2: string;
    hero_step_3: string;
    output_title: string;
  };
  placeholders: {
    scenario_idea: string;
  };
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  setting_types: Record<string, string>;
  time_periods: Record<string, string>;
  player_counts: Record<string, string>;
  complexities: Record<string, string>;
  mystery_types: Record<string, string>;
  tones: Record<string, string>;
  validation: {
    enter_scenario: string;
    select_model: string;
  };
  success: {
    random_prompt_selected: string;
    mystery_generated: string;
    mystery_copied: string;
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
