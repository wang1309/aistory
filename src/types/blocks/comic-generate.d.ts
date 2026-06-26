import { Section } from "./section";

export interface ComicGenerate {
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
    story_prompt_label: string;
    story_prompt_placeholder: string;
    comic_style_label: string;
    panel_count_label: string;
    tone_label: string;
    language_label: string;
    characters_label: string;
    add_character: string;
    character_name: string;
    character_personality: string;
    character_role: string;
    remove_character: string;
    setting_label: string;
    setting_placeholder: string;
    scene_goal_label: string;
    scene_goal_placeholder: string;
    narration_mode_label: string;
    reading_format_label: string;
    advanced_options: string;
    generate_button: string;
    generating: string;
    random_button: string;
    copy_button: string;
    continue_button: string;
    export_button: string;
    output_title: string;
    output_empty: string;
    panel_label: string;
    ai_model: string;
    clear_prompt: string;
    prompt_history: string;
    prompt_history_recent: string;
    prompt_history_empty: string;
    prompt_history_clear: string;
    theme_pills?: string[];
  };
  comic_styles: Record<string, string>;
  panel_counts: Record<string, string>;
  tones: Record<string, string>;
  narration_modes: Record<string, string>;
  reading_formats: Record<string, string>;
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  validation: {
    enter_prompt: string;
    select_model: string;
    add_characters: string;
  };
  success: {
    random_prompt_selected: string;
    script_generated: string;
    script_copied: string;
  };
  errors: {
    generation_failed: string;
  };
  output: {
    words: string;
    copy: string;
    export_md: string;
    export_txt: string;
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
