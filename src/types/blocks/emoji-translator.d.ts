import type { EmojiTranslatorMode, EmojiTranslatorScenario, EmojiTranslatorTone } from "@/types/emoji-translator";

export interface EmojiTranslatorOption {
  value: string;
  label: string;
}

export interface EmojiTranslatorRandomPreset {
  text?: string;
  context?: string;
  mode?: EmojiTranslatorMode;
  scenario?: EmojiTranslatorScenario;
  tone?: EmojiTranslatorTone;
}

export interface EmojiTranslatorSectionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface EmojiTranslatorSection {
  name: string;
  label?: string;
  title: string;
  description?: string;
  items?: EmojiTranslatorSectionItem[];
}

export interface EmojiTranslatorPage {
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
  ui: {
    title: string;
    title_highlight?: string;
    subtitle: string;
    theme_pills?: string[];
    eyebrow: string;
    breadcrumb_home: string;
    breadcrumb_current: string;
    form_title: string;
    text_label: string;
    text_placeholder: string;
    context_label: string;
    context_placeholder: string;
    mode_label: string;
    mode_options: EmojiTranslatorOption[];
    scenario_label: string;
    scenario_options: EmojiTranslatorOption[];
    tone_label: string;
    tone_options: EmojiTranslatorOption[];
    generate_button: string;
    generating_button: string;
    random_button?: string;
    output_title: string;
    empty_output: string;
    result_label: string;
    reason_label: string;
    caution_label: string;
    copy_button: string;
  };
  random_prompts?: EmojiTranslatorRandomPreset[];
  validation: {
    text_required: string;
    text_too_long: string;
    context_too_long: string;
    generic_error: string;
  };
  success: {
    copied: string;
    generated: string;
    random_prompt_selected?: string;
  };
  errors: {
    generate_failed: string;
    verification_failed: string;
  };
  feature1?: EmojiTranslatorSection;
  how_to_use?: EmojiTranslatorSection;
  feature2?: EmojiTranslatorSection;
  feature3?: EmojiTranslatorSection;
  faq?: EmojiTranslatorSection;
  cta?: {
    name?: string;
    title: string;
    description?: string;
    buttons?: Array<{ title: string; url: string; icon?: string }>;
  };
  related_tools?: {
    title: string;
    description?: string;
    more_label: string;
  };
}

export type { EmojiTranslatorMode, EmojiTranslatorScenario, EmojiTranslatorTone };
