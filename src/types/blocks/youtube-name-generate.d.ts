import { Section } from "./section";
import type {
  YoutubeNameCategory,
  YoutubeNameLengthPreference,
  YoutubeNamePivotFlexibility,
  YoutubeNameStyle,
  GeneratedYoutubeName,
} from "@/types/youtube-name";

export interface SavedYoutubeName {
  id: string;
  createdAt: string;
  niche: string;
  audience: string;
  style: YoutubeNameStyle;
  lengthPreference: YoutubeNameLengthPreference;
  pivotFlexibility: YoutubeNamePivotFlexibility;
  keywords: string[];
  creatorName: string;
  outputLanguage: string;
  output: GeneratedYoutubeName[];
  recommendedName: string;
  recommendedReason: string;
}

export interface YoutubeNameRandomPreset {
  niche: string;
  audience?: string;
  style?: YoutubeNameStyle;
  lengthPreference?: YoutubeNameLengthPreference;
  pivotFlexibility?: YoutubeNamePivotFlexibility;
  keywords?: string[];
  creatorName?: string;
}

export interface YoutubeNameGenerate {
  metadata?: {
    title: string;
    description: string;
    keywords: string;
  };
  ui?: {
    title?: string;
    title_highlight?: string;
    subtitle?: string;
    eyebrow?: string;
    theme_pills?: string[];
    breadcrumb_home?: string;
    breadcrumb_current?: string;
    niche_label?: string;
    niche_placeholder?: string;
    audience_label?: string;
    audience_placeholder?: string;
    style_label?: string;
    length_label?: string;
    pivot_label?: string;
    keywords_label?: string;
    keywords_placeholder?: string;
    creator_label?: string;
    creator_placeholder?: string;
    random_button?: string;
    options_title?: string;
    generate_button?: string;
    generating_button?: string;
    regenerate_button?: string;
    save_button?: string;
    saved_button?: string;
    remove_button?: string;
    copy_name_button?: string;
    copy_handle_button?: string;
    copy_fallback_button?: string;
    output_title?: string;
    empty_output?: string;
    generating_output?: string;
    results_count?: string;
    category_all?: string;
    best_for_label?: string;
    rationale_label?: string;
    scores_label?: string;
    score_memorability?: string;
    score_pronounceability?: string;
    score_uniqueness?: string;
    score_pivot?: string;
    handle_label?: string;
    handle_warnings?: string;
    handle_fallbacks?: string;
    handle_valid?: string;
    handle_invalid?: string;
    shortlist_title?: string;
    shortlist_empty?: string;
    shortlist_hint?: string;
    shortlist_full?: string;
    compare_title?: string;
    recommendation_title?: string;
    recommendation_reason?: string;
    recommendation_backup_label?: string;
    recommendation_next_actions?: string;
    history_title?: string;
    history_apply?: string;
    history_delete?: string;
    history_clear?: string;
    sort_strongest?: string;
    sort_label?: string;
  };
  validation?: {
    niche_required?: string;
    audience_required?: string;
  };
  success?: {
    copied_name?: string;
    copied_handle?: string;
    generated?: string;
    saved?: string;
    removed?: string;
    random_prompt_selected?: string;
    history_loaded?: string;
    history_deleted?: string;
    history_cleared?: string;
  };
  errors?: {
    generate_failed?: string;
    verification_failed?: string;
    parse_failed?: string;
  };
  style?: Partial<Record<YoutubeNameStyle, string>>;
  length?: Partial<Record<YoutubeNameLengthPreference, string>>;
  pivot?: Partial<Record<YoutubeNamePivotFlexibility, string>>;
  category?: Partial<Record<YoutubeNameCategory, string>>;
  random_prompts?: YoutubeNameRandomPreset[];
  feature1?: Section;
  feature2?: Section;
  feature3?: Section;
  how_to_use?: Section;
  faq?: Section;
  cta?: Section;
}
