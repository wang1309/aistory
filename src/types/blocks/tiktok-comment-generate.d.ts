import { Section } from "./section";
import type {
  TiktokCommentLength,
  TiktokCommentModelMode,
  TiktokCommentReplyGoal,
  TiktokCommentTone,
} from "@/types/tiktok-comment";

export interface SavedTiktokComment {
  id: string;
  createdAt: string;
  comment: string;
  context: string;
  replyGoal: TiktokCommentReplyGoal;
  tone: TiktokCommentTone;
  length: TiktokCommentLength;
  mode: TiktokCommentModelMode;
  outputLanguage: string;
  output: string;
}

export interface TiktokCommentRandomPreset {
  comment: string;
  context?: string;
  replyGoal?: TiktokCommentReplyGoal;
  tone?: TiktokCommentTone;
  length?: TiktokCommentLength;
}

export interface TiktokCommentGenerate {
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
    comment_label?: string;
    comment_placeholder?: string;
    random_button?: string;
    context_label?: string;
    context_placeholder?: string;
    options_title?: string;
    reply_goal_label?: string;
    tone_label?: string;
    length_label?: string;
    mode_label?: string;
    advanced_options?: string;
    output_language?: string;
    generate_button?: string;
    generating_button?: string;
    regenerate_button?: string;
    copy_button?: string;
    copy_all_button?: string;
    continue_button?: string;
    output_title?: string;
    empty_output?: string;
    generating_output?: string;
    history_title?: string;
    history_empty?: string;
    history_apply?: string;
    history_delete?: string;
    history_clear?: string;
  };
  validation?: {
    comment_required?: string;
  };
  success?: {
    copied?: string;
    copied_all?: string;
    generated?: string;
    continued?: string;
    random_prompt_selected?: string;
    history_loaded?: string;
    history_deleted?: string;
    history_cleared?: string;
  };
  errors?: {
    generate_failed?: string;
    verification_failed?: string;
  };
  ai_models?: {
    fast?: string;
    fast_description?: string;
    standard?: string;
    standard_description?: string;
    creative?: string;
    creative_description?: string;
  };
  reply_goal?: Partial<Record<TiktokCommentReplyGoal, string>>;
  tone?: Partial<Record<TiktokCommentTone, string>>;
  length?: Partial<Record<TiktokCommentLength, string>>;
  mode?: Partial<Record<TiktokCommentModelMode, string>>;
  random_prompts?: TiktokCommentRandomPreset[];
  feature?: Section;
  feature1?: Section;
  feature2?: Section;
  feature3?: Section;
  how_to_use?: Section;
  faq?: Section;
  cta?: Section;
}
