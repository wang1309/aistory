export interface FanficGenerate {
  header: {
    title: string;
    subtitle: string;
  };
  source: {
    label: string;
    required: string;
    preset_label: string;
    custom_label: string;
    preset_placeholder: string;
    worldview_label: string;
    worldview_placeholder: string;
    characters_label: string;
    characters_placeholder: string;
    characters_hint: string;
  };
  pairing: {
    label: string;
    required: string;
    type_label: string;
    type_options: {
      romantic: string;
      gen: string;
      poly: string;
    };
    character_placeholder: string;
    add_character: string;
    remove_character: string;
    hint: string;
  };
  plot_type: {
    label: string;
    required: string;
    options: {
      canon: {
        name: string;
        description: string;
      };
      modern_au: {
        name: string;
        description: string;
      };
      school_au: {
        name: string;
        description: string;
      };
      fantasy_au: {
        name: string;
        description: string;
      };
      crossover: {
        name: string;
        description: string;
      };
    };
  };
  prompt: {
    label: string;
    required: string;
    placeholder: string;
    character_counter: string;
    language_label: string;
    language_placeholder: string;
    language_options: {
      [key: string]: {
        native: string;
        english: string;
        flag: string;
      };
    };
  };
  presets: {
    title: string;
    works_title: string;
    templates_title: string;
    popular_pairings: string;
  };
  ai_models: {
    title: string;
    hint: string;
    models: {
      character_focused: {
        name: string;
        badge: string;
        description: string;
        speed: string;
      };
      creative: {
        name: string;
        badge: string;
        description: string;
        speed: string;
      };
      depth: {
        name: string;
        badge: string;
        description: string;
        speed: string;
      };
    };
    selected: string;
    select: string;
  };
  advanced_options: {
    title: string;
    subtitle: string;
    optional_badge: string;
    ooc: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        canon_compliant: string;
        slight_ooc: string;
        bold_adaptation: string;
      };
    };
    fidelity: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        high_fidelity: string;
        moderate: string;
        original: string;
      };
    };
    ending: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        happy: string;
        sad: string;
        open: string;
      };
    };
    rating: {
      label: string;
      placeholder: string;
      warning: string;
      options: {
        none: string;
        general: string;
        teen: string;
        mature: string;
        explicit: string;
      };
    };
    length: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        short: string;
        medium: string;
        long: string;
        extend: string;
        epic_short: string;
        novella_lite: string;
      };
    };
    perspective: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        first_person: string;
        second_person: string;
        third_person_limited: string;
        third_person_omniscient: string;
      };
    };
  };
  generate_button: {
    text: string;
    generating: string;
    info: {
      credit: string;
      credit_text: string;
      time: string;
      quality: string;
    };
    tip: string;
  };
  output: {
    title: string;
    status_writing: string;
    status_complete: string;
    word_count: string;
    tags_label: string;
    button_copy: string;
    button_export_pdf: string;
    button_exporting_pdf: string;
    button_regenerate: string;
    loading: string;
  };
  pdf: {
    generated_at: string;
    word_count_label: string;
    ai_model: string;
    source_work: string;
    pairing: string;
    plot_type: string;
    rating: string;
    tags: string;
    prompt: string;
    footer_text: string;
    page_indicator: string;
  };
  share: {
    title: string;
    copy_link: string;
    share_twitter: string;
    share_facebook: string;
    share_linkedin: string;
    link_copied: string;
    share_text_template: string;
  };
  toasts: {
    error_no_source: string;
    error_no_pairing: string;
    error_no_plot_type: string;
    error_no_prompt: string;
    error_no_model: string;
    error_generate_failed: string;
    error_no_stream: string;
    error_no_content: string;
    error_pdf_export_failed: string;
    error_invalid_characters: string;
    success_generated: string;
    success_copied: string;
    success_pdf_exported: string;
    warning_mature_content: string;
  };
  history: {
    title: string;
    empty: string;
    load: string;
    delete: string;
    clear_all: string;
    confirm_clear: string;
  };
  work_categories: {
    anime: string;
    novel: string;
    movie: string;
    game: string;
  };
  work_details: {
    worldview_label: string;
  };
  ui: {
    pairing_separator: string;
    speed_icon: string;
  };
  tabbed?: {
    hero?: {
      title?: string;
      subtitle?: string;
    };
    steps?: {
      step1?: {
        title?: string;
        description?: string;
      };
      step2?: {
        title?: string;
        description?: string;
      };
      step3?: {
        title?: string;
        description?: string;
      };
      step4?: {
        title?: string;
        description?: string;
      };
      step5?: {
        title?: string;
        description?: string;
      };
    };
    form?: {
      source_type_label?: string;
      preset_works?: string;
      custom_input?: string;
      work_name_placeholder?: string;
      work_name_label?: string;
      select_characters_label?: string;
      selected_count?: string;
      pairing_type_label?: string;
      romantic?: string;
      gen?: string;
      poly?: string;
      character_selected?: string;
      plot_type_label?: string;
      canon?: string;
      modern_au?: string;
      school_au?: string;
      fantasy_au?: string;
      language_label?: string;
      language_placeholder?: string;
      story_prompt_label?: string;
      story_prompt_placeholder?: string;
      popular_works?: string;
      story_prompt_hint?: string;
      character_counter?: string;
      meets_requirements?: string;
      advanced_options?: {
        title?: string;
        subtitle?: string;
        ooc_level?: string;
        ooc_none?: string;
        ooc_slight?: string;
        ooc_moderate?: string;
        ooc_bold?: string;
        story_length?: string;
        length_short?: string;
        length_medium?: string;
        length_long?: string;
        narrative_perspective?: string;
        perspective_first?: string;
        perspective_second?: string;
        perspective_third_limited?: string;
        perspective_third_omniscient?: string;
      };
      generation?: {
        status_writing?: string;
        status_complete?: string;
        start_button?: string;
        summary_title?: string;
        source_work_label?: string;
        pairing_label?: string;
        type_label?: string;
        length_label?: string;
        progress_label?: string;
        word_count?: string;
        actions?: {
          copy?: string;
          regenerate?: string;
          download_pdf?: string;
        };
        undefined?: string;
      };
    };
    buttons?: {
      next_step?: string;
      previous_step?: string;
      start_creation?: string;
      regenerating?: string;
    };
    summary?: {
      title?: string;
      source_work?: string;
      pairing?: string;
      plot_type?: string;
      story_length?: string;
    };
    status?: {
      completed?: string;
      optional?: string;
      generating?: string;
      creation_complete?: string;
      word_count?: string;
    };
    messages?: {
      step_completed?: string;
      error_complete_current?: string;
      error_gen_limit?: string;
      error_romantic_limit?: string;
      toast_copied?: string;
      copy_success?: string;
      generation_success?: string;
      step_validation?: string;
      auto_advance?: string;
      error_generation?: string;
    };
  };
  modern?: {
    steps?: {
      step1?: {
        title?: string;
        description?: string;
      };
      step2?: {
        title?: string;
        description?: string;
      };
      step3?: {
        title?: string;
        description?: string;
      };
      step4?: {
        title?: string;
        description?: string;
      };
      step5?: {
        title?: string;
        description?: string;
      };
    };
    form?: {
      select_work?: string;
      custom_work?: string;
      work_name_hint?: string;
      pairing_type?: string;
      select_characters?: string;
      selected_count?: string;
      plot_types?: string;
      story_requirements?: string;
      minimum_chars?: string;
      character_count?: string;
      meets_requirements?: string;
      advanced_settings?: string;
      ooc_level?: string;
      ooc_none?: string;
      ooc_slight?: string;
      ooc_moderate?: string;
      ooc_heavy?: string;
      story_length?: string;
      length_options?: {
        short?: string;
        medium?: string;
        long?: string;
        epic?: string;
      };
      narrative_perspective?: string;
      perspective_options?: {
        first?: string;
        second?: string;
        third_limited?: string;
        third_omniscient?: string;
      };
    };
    actions?: {
      next?: string;
      previous?: string;
      generate_fanfic?: string;
      generating?: string;
      retry?: string;
      copy?: string;
    };
    summary?: {
      title?: string;
      source_work_label?: string;
      selected_pairing_label?: string;
      plot_type_label?: string;
      length_label?: string;
      undefined?: string;
    };
    results?: {
      generation_title?: string;
      word_count?: string;
      copy_success?: string;
      regenerate?: string;
      download_pdf?: string;
    };
    messages?: {
      step_validation?: string;
      auto_advance?: string;
      generation_success?: string;
      copy_success?: string;
      error_generation?: string;
    };
  };
}

// Data models for preset works
export interface Character {
  id: string;
  name: string;
  nameEn: string;
  nameDe: string;
  nameJa: string;
  nameKo: string;
  role: 'main' | 'supporting';
  description: string;
}

export interface PresetWork {
  id: string;
  name: string;
  nameEn: string;
  nameDe: string;
  nameJa: string;
  nameKo: string;
  category: 'anime' | 'novel' | 'movie' | 'game';
  description: string;
  worldview: string;
  characters: Character[];
  popularPairings: string[][];
}

// Saved fanfic model
export interface SavedFanfic {
  id: string;
  title: string;
  source: {
    type: 'preset' | 'custom';
    name: string;
    characters?: string[];
  };
  pairing: {
    type: 'romantic' | 'gen' | 'poly';
    characters: string[];
  };
  plotType: string;
  prompt: string;
  content: string;
  wordCount: number;
  tags: string[];
  model: string;
  options: {
    ooc: string;
    fidelity: string;
    ending: string;
    rating: string;
    length: string;
    perspective: string;
  };
  createdAt: string;
}

// API request model
export interface FanficGenerateRequest {
  source: {
    type: 'preset' | 'custom';
    name: string;
    worldview?: string;
    characters?: string[];
  };
  pairing: {
    type: 'romantic' | 'gen' | 'poly';
    characters: string[];
  };
  plotType: string;
  prompt: string;
  model: string;
  locale: string;
  outputLanguage: string;
  options: {
    ooc: string;
    fidelity: string;
    ending: string;
    rating: string;
    length: string;
    perspective: string;
  };
  turnstileToken: string;
}
