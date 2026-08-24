import type {
  MiddleNameCadence,
  MiddleNameEra,
  MiddleNameOutputLocale,
  MiddleNameSetting,
  MiddleNameTone,
  MiddleNameUseCase,
} from "@/types/middle-name-generator";

export interface MiddleNameOption {
  value: string;
  label: string;
}

export interface MiddleNameSectionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface MiddleNameSection {
  name: string;
  label?: string;
  title: string;
  description?: string;
  items?: MiddleNameSectionItem[];
}

export interface MiddleNameContinuation {
  title: string;
  description?: string;
  dialogue_label: string;
  dialogue_hint: string;
  backstory_label: string;
  backstory_hint: string;
  prompt_label: string;
  prompt_hint: string;
}

export interface MiddleNameGeneratorPage {
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
    mode_label: string;
    mode_options: MiddleNameOption[];
    use_case_label: string;
    use_case_options: MiddleNameOption[];
    first_name_label: string;
    first_name_placeholder: string;
    last_name_label: string;
    last_name_placeholder: string;
    setting_label: string;
    setting_options: MiddleNameOption[];
    era_label: string;
    era_options: MiddleNameOption[];
    tone_label: string;
    tone_options: MiddleNameOption[];
    cadence_label: string;
    cadence_options: MiddleNameOption[];
    avoid_initials_label: string;
    avoid_initials_placeholder: string;
    note_label: string;
    note_placeholder: string;
    privacy_hint: string;
    generate_button: string;
    generating_button: string;
    sign_in_button: string;
    reroll_button: string;
    output_title: string;
    empty_output: string;
    direction_label: string;
    middle_name_label: string;
    initials_label: string;
    initials_warning: string;
    cadence_note_label: string;
    implication_label: string;
    copy_button: string;
    favorite_button: string;
    favorited_button: string;
    continue_button: string;
    favorites_title: string;
    loading_status: string;
  };
  validation: {
    name_too_long: string;
    avoid_initials_too_long: string;
    note_too_long: string;
    creative_limit_reached: string;
    generic_error: string;
  };
  success: {
    copied: string;
    generated: string;
    favorited: string;
    unfavorited: string;
    continue_copied: string;
  };
  errors: {
    generate_failed: string;
    verification_failed: string;
  };
  continuation: MiddleNameContinuation;
  feature1?: MiddleNameSection;
  how_to_use?: MiddleNameSection;
  feature2?: MiddleNameSection;
  feature3?: MiddleNameSection;
  faq?: MiddleNameSection;
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

export type {
  MiddleNameCadence,
  MiddleNameEra,
  MiddleNameOutputLocale,
  MiddleNameSetting,
  MiddleNameTone,
  MiddleNameUseCase,
};
