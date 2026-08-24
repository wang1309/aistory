import type { BandTemplateIdea } from "@/types/band-name-generator";

export interface BandNameOption {
  value: string;
  label: string;
}

export interface BandNameSectionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface BandNameSection {
  name: string;
  label?: string;
  title: string;
  description?: string;
  items?: BandNameSectionItem[];
}

export interface BandNameContinuation {
  title: string;
  description?: string;
  character_label: string;
  character_hint: string;
  backstory_label: string;
  backstory_hint: string;
  prompt_label: string;
  prompt_hint: string;
}

export interface BandNameGeneratorPage {
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
    genre_options: BandNameOption[];
    vibe_label: string;
    vibe_options: BandNameOption[];
    length_label: string;
    length_options: BandNameOption[];
    mode_label: string;
    mode_options: BandNameOption[];
    model_label: string;
    model_options: BandNameOption[];
    sign_in_button: string;
    template_note: string;
    cue_label: string;
    cue_placeholder: string;
    inspiration_hint: string;
    generate_button: string;
    generating_button: string;
    reroll_button: string;
    output_title: string;
    output_title_template: string;
    empty_output: string;
    result_label: string;
    pronunciation_label: string;
    rationale_label: string;
    genre_fit_label: string;
    bio_label: string;
    visual_label: string;
    pattern_label: string;
    pattern_labels: Record<BandTemplateIdea["pattern"], string>;
    copy_button: string;
    favorite_button: string;
    favorited_button: string;
    similar_button: string;
    favorites_title: string;
    check_button: string;
    check_close_button: string;
    check_disclaimer: string;
    check_links: {
      search: string;
      spotify: string;
      youtube: string;
      instagram: string;
      domain: string;
      trademark: string;
    };
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
  continuation: BandNameContinuation;
  feature1?: BandNameSection;
  how_to_use?: BandNameSection;
  feature2?: BandNameSection;
  feature3?: BandNameSection;
  faq?: BandNameSection;
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
