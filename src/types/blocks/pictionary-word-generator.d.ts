import type {
  PictionaryCategory,
  PictionaryDifficulty,
} from "@/lib/pictionary-words";

export type { PictionaryCategory, PictionaryDifficulty };

export interface PictionaryOption {
  value: string;
  label: string;
}

export interface PictionarySection {
  name: string;
  label?: string;
  title: string;
  description?: string;
  items?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
}

export interface PictionaryWordGeneratorPage {
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
  ui: {
    title: string;
    title_highlight?: string;
    subtitle: string;
    eyebrow: string;
    breadcrumb_home: string;
    breadcrumb_current: string;
    form_title: string;
    category_label: string;
    category_options: PictionaryOption[];
    difficulty_label: string;
    difficulty_options: PictionaryOption[];
    count_label: string;
    count_options: PictionaryOption[];
    custom_toggle: string;
    custom_placeholder: string;
    custom_hint: string;
    draw_button: string;
    reroll_button: string;
    reset_button: string;
    copy_button: string;
    output_title: string;
    empty_output: string;
    pool_label: string;
    timer_label: string;
    timer_options: PictionaryOption[];
    timer_custom_label?: string;
    timer_start: string;
    timer_pause: string;
    timer_reset: string;
    timer_done: string;
    score_title: string;
    team_a: string;
    team_b: string;
    score_reset: string;
    disclaimer: string;
  };
  validation: {
    no_words: string;
    custom_invalid: string;
  };
  success: {
    drawn: string;
    copied: string;
  };
  feature1?: PictionarySection;
  how_to_use?: PictionarySection;
  feature2?: PictionarySection;
  feature3?: PictionarySection;
  word_list?: {
    name?: string;
    label?: string;
    title?: string;
    description?: string;
    disabled?: boolean;
  };
  faq?: PictionarySection;
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
