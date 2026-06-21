import { Section } from "@/types/blocks/section";
import type {
  YoutubeTitleLengthPreference,
  YoutubeTitleOptimizationPreference,
} from "@/types/youtube-title";

export interface YoutubeTitleRandomPreset {
  videoTopic: string;
  targetAudience?: string;
  summary?: string;
  titleLengthPreference?: YoutubeTitleLengthPreference;
  optimizationPreference?: YoutubeTitleOptimizationPreference;
  avoidWords?: string[];
}

export interface YoutubeTitleGenerateSection {
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
    topic_label?: string;
    topic_placeholder?: string;
    audience_label?: string;
    audience_placeholder?: string;
    summary_label?: string;
    summary_placeholder?: string;
    transcript_label?: string;
    transcript_placeholder?: string;
    length_label?: string;
    optimization_label?: string;
    avoid_words_label?: string;
    avoid_words_placeholder?: string;
    random_button?: string;
    options_title?: string;
    advanced_title?: string;
    generate_button?: string;
    generating_button?: string;
    regenerate_button?: string;
    save_button?: string;
    saved_button?: string;
    remove_button?: string;
    copy_title_button?: string;
    output_title?: string;
    empty_output?: string;
    generating_output?: string;
    results_count?: string;
    angle_all?: string;
    angle_search?: string;
    angle_curiosity?: string;
    angle_outcome?: string;
    angle_contrarian?: string;
    best_use_label?: string;
    reason_label?: string;
    diagnostics_label?: string;
    diag_chars?: string;
    diag_truncation?: string;
    diag_keyword?: string;
    diag_authenticity?: string;
    shortlist_title?: string;
    shortlist_empty?: string;
    shortlist_hint?: string;
    shortlist_full?: string;
    compare_title?: string;
    recommendation_title?: string;
    recommendation_reason?: string;
    recommendation_backup_label?: string;
    history_title?: string;
    history_apply?: string;
    history_delete?: string;
    history_clear?: string;
  };
  validation?: {
    topic_required?: string;
    audience_required?: string;
    summary_required?: string;
    generic_error?: string;
  };
  success?: {
    copied?: string;
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
  };
  length?: Partial<Record<YoutubeTitleLengthPreference, string>>;
  optimization?: Partial<Record<YoutubeTitleOptimizationPreference, string>>;
  risk?: {
    low?: string;
    medium?: string;
    high?: string;
  };
  placement?: {
    "front-loaded"?: string;
    "mid-title"?: string;
    late?: string;
    none?: string;
  };
  random_prompts?: YoutubeTitleRandomPreset[];
  feature1?: Section;
  feature2?: Section;
  feature3?: Section;
  how_to_use?: Section;
  faq?: Section;
  cta?: Section;
}

export interface SavedYoutubeTitle {
  id: string;
  createdAt: string;
  videoTopic: string;
  targetAudience: string;
  summary: string;
  titleLengthPreference: YoutubeTitleLengthPreference;
  optimizationPreference: YoutubeTitleOptimizationPreference;
  avoidWords: string[];
  output: import("@/types/youtube-title").GeneratedYoutubeTitle[];
  recommendedTitle: string;
  recommendedReason: string;
  backupTitle: string;
}
