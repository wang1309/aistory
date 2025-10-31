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
