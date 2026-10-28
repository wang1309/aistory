import { Section } from "./section";

export interface GenreStoryLink {
  label: string;
  href: string | null;
}

export interface GenreStorySeoItem {
  title: string;
  description: string;
}

export interface GenreStorySeoStep {
  title: string;
  description: string;
}

export interface GenreStoryTitleTool {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  button: string;
  generating: string;
  error: string;
  empty: string;
  result_title: string;
  validation: string;
  language_label: string;
}

export interface GenreStoryOptionField {
  key: string;
  label: string;
  description?: string;
  options: Record<string, string>;
}

export interface GenreStoryHeroExample {
  label: string;
  title?: string;
  text: string;
}

export interface HorrorStorySeo {
  ideas_and_plots: {
    title: string;
    intro: string;
    twist_title: string;
    twist_intro: string;
    ideas: GenreStorySeoItem[];
    structure_title: string;
    structure_items: GenreStorySeoItem[];
  };
  prompts_by_subgenre: {
    title: string;
    intro: string;
    items: Array<{
      title: string;
      description: string;
      prompt: string;
    }>;
  };
  title_generator: GenreStoryTitleTool;
  two_sentence_stories: {
    title: string;
    intro: string;
    items: string[];
  };
  how_to: {
    title: string;
    intro: string;
    steps: GenreStorySeoStep[];
  };
  audiences: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  video_adaptation: {
    title: string;
    intro: string;
    capability_notice: string;
    items: string[];
    link: GenreStoryLink;
  };
  definition: {
    title: string;
    intro: string;
    paragraphs: string[];
  };
  faq_heading: string;
  internal_links: GenreStoryLink[];
}

export interface MysteryStorySeo {
  headings: string[];
  ideas_and_plots: {
    title: string;
    intro: string;
    twist_title: string;
    twist_intro: string;
    items: GenreStorySeoItem[];
  };
  prompts_by_subgenre: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  murder_mystery: {
    title: string;
    intro: string;
    href: string | null;
    paragraphs: string[];
  };
  title_generator: GenreStoryTitleTool;
  how_to: {
    title: string;
    intro: string;
    steps: GenreStorySeoStep[];
  };
  clues: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  comparison: {
    title: string;
    intro: string;
    mystery: string;
    thriller: string;
  };
  audiences: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  definition: {
    title: string;
    intro: string;
    paragraphs: string[];
  };
  faq_heading: string;
  story_ideas: {
    href: string | null;
  };
  internal_links: GenreStoryLink[];
}

export interface SciFiStorySeo {
  headings: string[];
  ideas_and_plots: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  writing_prompts: {
    title: string;
    intro: string;
    href: string | null;
    items: GenreStorySeoItem[];
  };
  worldbuilding: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  title_generator: GenreStoryTitleTool;
  how_to: {
    title: string;
    intro: string;
    steps: GenreStorySeoStep[];
  };
  hard_sf: {
    title: string;
    intro: string;
    paragraphs: string[];
  };
  comparison: {
    title: string;
    intro: string;
    sci_fi: string;
    fantasy: string;
  };
  audiences: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  definition: {
    title: string;
    intro: string;
    paragraphs: string[];
  };
  faq_heading: string;
  name_generator: {
    href: string | null;
  };
  story_ideas: {
    href: string | null;
  };
  internal_links: GenreStoryLink[];
}

export interface AdventureStorySeo {
  headings: string[];
  ideas_and_plots: {
    title: string;
    intro: string;
    twist_title: string;
    twist_intro: string;
    items: GenreStorySeoItem[];
  };
  writing_prompts: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  choose_your_own: {
    title: string;
    intro: string;
    href: string | null;
    paragraphs: string[];
    example: string;
  };
  branching_outline: {
    title: string;
    intro: string;
    steps: GenreStorySeoStep[];
  };
  title_generator: GenreStoryTitleTool;
  tabletop: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  how_to: {
    title: string;
    intro: string;
    steps: GenreStorySeoStep[];
  };
  what_works: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  comparison: {
    title: string;
    intro: string;
    adventure: string;
    fantasy: string;
  };
  audiences: {
    title: string;
    intro: string;
    items: GenreStorySeoItem[];
  };
  definition: {
    title: string;
    intro: string;
    paragraphs: string[];
  };
  faq_heading: string;
  dnd_campaign: {
    href: string | null;
  };
  superhero: {
    href: string | null;
  };
  story_ideas: {
    href: string | null;
  };
  internal_links: GenreStoryLink[];
}

export interface GenreStoryCommonField {
  label: string;
  description?: string;
  options: Record<string, string>;
}

export interface GenreStoryGenerateSection {
  metadata: {
    title: string;
    description: string;
  };
  ui: {
    title: string;
    title_highlight?: string;
    subtitle: string;
    trust_line?: string;
    breadcrumb_home: string;
    breadcrumb_current: string;
    story_idea: string;
    random_button: string;
    ai_model: string;
    output_language: string;
    advanced_options: string;
    generate_button: string;
    generating: string;
    output_title: string;
    empty_output: string;
    example_label: string;
    copy_button: string;
    copied: string;
    save_button: string;
    continue_button: string;
    word_count: string;
    branching_hint?: string;
  };
  placeholders: {
    story_idea: string;
  };
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  common_fields: {
    length: GenreStoryCommonField;
    tone: GenreStoryCommonField;
    perspective: GenreStoryCommonField;
    audience: GenreStoryCommonField;
  };
  genre_fields: GenreStoryOptionField[];
  random_prompts: string[];
  validation: {
    enter_idea: string;
    select_model: string;
    verification_failed?: string;
  };
  success: {
    story_generated: string;
    story_copied: string;
    random_prompt_selected: string;
    saved_locally: string;
  };
  errors: {
    generation_failed: string;
    save_failed: string;
  };
  output: {
    title: string;
    words: string;
    copy: string;
    empty: string;
  };
  completion_guide: {
    title: string;
    subtitle: string;
    create_another: string;
    share_action: string;
    continue_label: string;
    continue_hint?: string;
  };
  hero_examples?: GenreStoryHeroExample[];
  horror_seo?: HorrorStorySeo;
  mystery_seo?: MysteryStorySeo;
  sci_fi_seo?: SciFiStorySeo;
  adventure_seo?: AdventureStorySeo;
  feature_intro?: Section;
  how_to_use?: Section;
  feature_benefits?: Section;
  feature_section?: Section;
  faq_section?: Section;
  cta_section?: Section;
}
