import type {
  PenNameBrandGoal,
  PenNameForm,
  PenNameGenre,
  PenNameMarket,
  PenNameTone,
} from "@/types/pen-name-generator";

export interface PenNameOption {
  value: string;
  label: string;
}

export interface PenNameSectionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface PenNameSection {
  name: string;
  label?: string;
  title: string;
  description?: string;
  items?: PenNameSectionItem[];
}

export interface PenNameScreeningItem {
  title: string;
  description: string;
}

export interface PenNameScreening {
  title: string;
  disclaimer: string;
  open_button: string;
  close_button: string;
  items: PenNameScreeningItem[];
}

export interface PenNameGeneratorPage {
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
    genre_label: string;
    genre_options: PenNameOption[];
    brand_goal_label: string;
    brand_goal_options: PenNameOption[];
    tone_label: string;
    tone_options: PenNameOption[];
    name_form_label: string;
    name_form_options: PenNameOption[];
    target_market_label: string;
    target_market_options: PenNameOption[];
    cue_label: string;
    cue_placeholder: string;
    inspiration_hint: string;
    mode_label: string;
    mode_options: PenNameOption[];
    sign_in_button: string;
    generate_button: string;
    generating_button: string;
    reroll_button: string;
    output_title: string;
    empty_output: string;
    result_label: string;
    pronunciation_label: string;
    reason_label: string;
    copy_button: string;
    favorite_button: string;
    favorited_button: string;
    similar_button: string;
    favorites_title: string;
    loading_status: string;
  };
  validation: {
    cue_too_long: string;
    inspiration_too_long: string;
    generic_error: string;
    creative_limit_reached: string;
  };
  success: {
    copied: string;
    generated: string;
    favorited: string;
    unfavorited: string;
  };
  errors: {
    generate_failed: string;
    verification_failed: string;
  };
  screening: PenNameScreening;
  feature1?: PenNameSection;
  how_to_use?: PenNameSection;
  feature2?: PenNameSection;
  feature3?: PenNameSection;
  faq?: PenNameSection;
  cta?: {
    name?: string;
    title: string;
    description?: string;
    buttons?: Array<{ title: string; url: string; icon?: string }>;
  };
  related_tools: {
    title: string;
    description?: string;
    more_label: string;
  };
}

export type { PenNameBrandGoal, PenNameForm, PenNameGenre, PenNameMarket, PenNameTone };
