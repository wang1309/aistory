import { Section } from "./section";
import {
  IncorrectQuoteLength,
  IncorrectQuoteMode,
  IncorrectQuoteRelationshipMode,
  IncorrectQuoteSafetyOptions,
  IncorrectQuoteTone,
} from "@/types/incorrect-quote";

export interface SavedIncorrectQuote {
  id: string;
  createdAt: string;
  prompt: string;
  characters: string[];
  relationshipMode: IncorrectQuoteRelationshipMode;
  tone: IncorrectQuoteTone;
  length: IncorrectQuoteLength;
  mode: IncorrectQuoteMode;
  safety: IncorrectQuoteSafetyOptions;
  output: string;
}

export interface IncorrectQuoteGenerate {
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
    prompt_label?: string;
    prompt_placeholder?: string;
    random_button?: string;
    characters_label?: string;
    character_placeholder?: string;
    add_character?: string;
    remove_character?: string;
    options_title?: string;
    relationship_label?: string;
    tone_label?: string;
    length_label?: string;
    mode_label?: string;
    advanced_options?: string;
    output_language?: string;
    safety_title?: string;
    no_romance?: string;
    avoid_shipping?: string;
    keep_it_clean?: string;
    generate_button?: string;
    generating_button?: string;
    regenerate_button?: string;
    copy_button?: string;
    continue_button?: string;
    output_title?: string;
    empty_output?: string;
    generating_output?: string;
    history_saved?: string;
  };
  validation?: {
    prompt_required?: string;
  };
  success?: {
    copied?: string;
    generated?: string;
    continued?: string;
  };
  errors?: {
    generate_failed?: string;
    verification_failed?: string;
  };
  toasts?: {
    creative_limit_reached?: string;
  };
  ai_models?: {
    fast?: string;
    fast_description?: string;
    standard?: string;
    standard_description?: string;
    creative?: string;
    creative_description?: string;
  };
  relationship_mode?: Partial<Record<IncorrectQuoteRelationshipMode, string>>;
  tone?: Partial<Record<IncorrectQuoteTone, string>>;
  length?: Partial<Record<IncorrectQuoteLength, string>>;
  mode?: Partial<Record<IncorrectQuoteMode, string>>;
  random_prompts?: Array<{
    prompt: string;
    characters: string[];
  }>;
  feature?: Section;
  feature1?: Section;
  feature2?: Section;
  feature3?: Section;
  how_to_use?: Section;
  faq?: Section;
  cta?: Section;
}
