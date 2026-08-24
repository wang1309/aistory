import type {
  ElfHeritage,
  ElfNameForm,
  ElfNameStyle,
  ElfNameUse,
} from "@/types/elf-name-generator";

export interface ElfNameOption {
  value: string;
  label: string;
}

export interface ElfNameSectionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ElfNameSection {
  name: string;
  label?: string;
  title: string;
  description?: string;
  items?: ElfNameSectionItem[];
}

export interface ElfNameGeneratorPage {
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
    heritage_label: string;
    heritage_options: ElfNameOption[];
    custom_heritage_label: string;
    custom_heritage_placeholder: string;
    custom_heritage_helper: string;
    style_label: string;
    style_options: ElfNameOption[];
    name_use_label: string;
    name_use_options: ElfNameOption[];
    name_form_label: string;
    name_form_options: ElfNameOption[];
    role_label: string;
    role_placeholder: string;
    inspiration_hint: string;
    mode_label: string;
    mode_options: ElfNameOption[];
    sign_in_button: string;
    generate_button: string;
    generating_button: string;
    reroll_button: string;
    output_title: string;
    empty_output: string;
    result_label: string;
    pronunciation_label: string;
    meaning_label: string;
    reason_label: string;
    copy_button: string;
    favorite_button: string;
    favorited_button: string;
    similar_button: string;
    favorites_title: string;
  };
  validation: {
    custom_heritage_required: string;
    role_too_long: string;
    custom_heritage_too_long: string;
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
  feature1?: ElfNameSection;
  how_to_use?: ElfNameSection;
  feature2?: ElfNameSection;
  feature3?: ElfNameSection;
  faq?: ElfNameSection;
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

export type { ElfHeritage, ElfNameForm, ElfNameStyle, ElfNameUse };
