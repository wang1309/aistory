import type {
  GangFlavor,
  GangGroupType,
  GangOutputLocale,
  GangTone,
  GangWorld,
} from "@/types/gang-name-generator";

export interface GangNameOption {
  value: string;
  label: string;
}

export interface GangNameSectionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface GangNameSection {
  name: string;
  label?: string;
  title: string;
  description?: string;
  items?: GangNameSectionItem[];
}

export interface GangNameFictionalItem {
  title: string;
  description: string;
}

export interface GangNameFictionalGuide {
  title: string;
  disclaimer: string;
  open_button: string;
  close_button: string;
  items: GangNameFictionalItem[];
}

export interface GangNameContinuation {
  title: string;
  description?: string;
  leader_label: string;
  leader_hint: string;
  backstory_label: string;
  backstory_hint: string;
  plot_label: string;
  plot_hint: string;
}

export interface GangNameGeneratorPage {
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
    world_label: string;
    world_options: GangNameOption[];
    group_type_label: string;
    group_type_options: GangNameOption[];
    tone_label: string;
    tone_options: GangNameOption[];
    flavor_label: string;
    flavor_options: GangNameOption[];
    cue_label: string;
    cue_placeholder: string;
    inspiration_hint: string;
    mode_label: string;
    mode_options: GangNameOption[];
    sign_in_button: string;
    generate_button: string;
    generating_button: string;
    reroll_button: string;
    output_title: string;
    empty_output: string;
    result_label: string;
    meaning_label: string;
    reputation_label: string;
    territory_label: string;
    symbol_label: string;
    core_value_label: string;
    rival_hook_label: string;
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
  fictional_only: GangNameFictionalGuide;
  continuation: GangNameContinuation;
  feature1?: GangNameSection;
  how_to_use?: GangNameSection;
  feature2?: GangNameSection;
  feature3?: GangNameSection;
  faq?: GangNameSection;
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
  GangFlavor,
  GangGroupType,
  GangOutputLocale,
  GangTone,
  GangWorld,
};
