import { Section } from "./section";

export interface DndBackstoryGenerate {
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
    character_concept: string;
    random_button: string;
    ai_model: string;
    output_language: string;
    race: string;
    character_class: string;
    background: string;
    campaign_tone: string;
    use_case: string;
    output_length: string;
    advanced_options: string;
    alignment: string;
    core_motivation: string;
    defining_event: string;
    flaw_or_fear: string;
    important_bond: string;
    secret: string;
    hook_type: string;
    world_notes: string;
    party_role: string;
    deity_patron_oath: string;
    rival_faction: string;
    extra_constraints: string;
    generate_button: string;
    generating: string;
    hero_step_1: string;
    hero_step_2: string;
    hero_step_3: string;
    output_title: string;
  };
  placeholders: {
    character_concept: string;
    race: string;
    character_class: string;
    background: string;
    core_motivation: string;
    defining_event: string;
    flaw_or_fear: string;
    important_bond: string;
    secret: string;
    world_notes: string;
    party_role: string;
    deity_patron_oath: string;
    rival_faction: string;
    extra_constraints: string;
  };
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  race_options: Record<string, string>;
  class_options: Record<string, string>;
  campaign_tones: Record<string, string>;
  use_cases: Record<string, string>;
  lengths: Record<string, string>;
  alignments: Record<string, string>;
  hook_types: Record<string, string>;
  output_languages: Record<string, string>;
  validation: {
    enter_concept: string;
    enter_race: string;
    enter_class: string;
    enter_background: string;
    select_model: string;
  };
  success: {
    random_prompt_selected: string;
    backstory_generated: string;
    backstory_copied: string;
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
