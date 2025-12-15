import { Section } from "./section";

export interface DialogueGenerate {
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
    scenario_prompt: string;
    random_button: string;
    ai_model: string;
    output_language: string;
    dialogue_type: string;
    tone: string;
    output_length: string;
    setting: string;
    include_narration: string;
    characters: string;
    add_character: string;
    character_name: string;
    character_personality: string;
    character_role: string;
    remove_character: string;
    advanced_options: string;
    generate_button: string;
    generating: string;
  };
  placeholders: {
    scenario_prompt: string;
    select_ai_model: string;
    character_name: string;
    character_personality: string;
    character_role: string;
    setting: string;
  };
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  dialogue_type: {
    conversation: string;
    argument: string;
    interview: string;
    negotiation: string;
    confession: string;
    comedy: string;
    dramatic: string;
    philosophical: string;
  };
  tone: {
    casual: string;
    formal: string;
    emotional: string;
    humorous: string;
    tense: string;
    romantic: string;
    mysterious: string;
  };
  length: {
    short: string;
    short_description: string;
    medium: string;
    medium_description: string;
    long: string;
    long_description: string;
  };
  output: {
    title: string;
    words: string;
    copy: string;
    generating_message: string;
    empty_message: string;
  };
  validation: {
    enter_scenario: string;
    select_ai_model: string;
    add_characters: string;
  };
  success: {
    random_prompt_selected: string;
    dialogue_generated: string;
    dialogue_copied: string;
  };
  errors: {
    generation_failed: string;
  };
  random_prompts: string[];
  feature?: Section;
  feature1?: Section;
  feature2?: Section;
  feature3?: Section;
  faq?: Section;
  cta?: Section;
}
