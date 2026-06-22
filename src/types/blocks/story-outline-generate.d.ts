import { Section } from "@/types/blocks/section";
import type {
  StoryOutlineAudience,
  StoryOutlineGenre,
  StoryOutlineTargetLength,
  StoryOutlineTone,
} from "@/types/story-outline";

export interface StoryOutlineGenerateSection {
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
    story_idea_label?: string;
    story_idea_placeholder?: string;
    genre_label?: string;
    tone_label?: string;
    target_length_label?: string;
    audience_label?: string;
    random_button?: string;
    generate_button?: string;
    generating_button?: string;
    regenerate_button?: string;
    output_title?: string;
    empty_output?: string;
    premise_label?: string;
    conflict_label?: string;
    arc_label?: string;
    beats_label?: string;
    next_step_label?: string;
    expand_button?: string;
    expanding_button?: string;
    chapter_output_title?: string;
    no_credits_title?: string;
    no_credits_description?: string;
    buy_credits_button?: string;
  };
  validation?: {
    story_idea_required?: string;
  };
  success?: {
    generated?: string;
    expanded?: string;
  };
  errors?: {
    generate_failed?: string;
    expand_failed?: string;
    verification_failed?: string;
  };
  genre_options?: Partial<Record<StoryOutlineGenre, string>>;
  tone_options?: Partial<Record<StoryOutlineTone, string>>;
  target_length_options?: Partial<Record<StoryOutlineTargetLength, string>>;
  audience_options?: Partial<Record<StoryOutlineAudience, string>>;
  random_prompts?: string[];
  feature1?: Section;
  feature2?: Section;
  feature3?: Section;
  how_to_use?: Section;
  faq?: Section;
  cta?: Section;
}
