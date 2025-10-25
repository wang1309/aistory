export interface HeroBooktitle {
  breadcrumb: {
    home: string;
    current: string;
  };
  header: {
    title: string;
    subtitle: string;
  };
  form: {
    description: {
      label: string;
      required: string;
      placeholder: string;
      helper_text: string;
      character_counter: string;
      max_length: number;
    };
    genre: {
      label: string;
      required: string;
      placeholder: string;
      options: {
        none: string;
        fiction: string;
        non_fiction: string;
        fantasy: string;
        science_fiction: string;
        romance: string;
        mystery: string;
        horror: string;
        historical: string;
        biography: string;
        self_help: string;
        business: string;
        young_adult: string;
        children: string;
        poetry: string;
        drama: string;
        crime: string;
        adventure: string;
        literary: string;
        psychological: string;
        paranormal: string;
      };
    };
    tone: {
      label: string;
      required: string;
      placeholder: string;
      options: {
        none: string;
        dark: string;
        light: string;
        humorous: string;
        dramatic: string;
        romantic: string;
        suspenseful: string;
        inspirational: string;
        melancholic: string;
        whimsical: string;
        serious: string;
        edgy: string;
        nostalgic: string;
        mysterious: string;
        epic: string;
        intimate: string;
      };
    };
    style: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        classic: string;
        modern: string;
        dramatic: string;
        single_word: string;
        question: string;
        essay: string;
        research_paper: string;
        marketing: string;
        email_subject: string;
        blog: string;
        newspaper: string;
        journal: string;
      };
    };
    examples?: {
      title: string;
      expand: string;
      collapse: string;
      categories: {
        fantasy: string;
        romance: string;
        mystery_thriller: string;
        self_help: string;
      };
      prompts: {
        fantasy: string[];
        romance: string[];
        mystery_thriller: string[];
        self_help: string[];
      };
    };
  };
  generate_button: {
    text: string;
    generating: string;
    info: {
      free: string;
      time: string;
    };
  };
  output: {
    title: string;
    subtitle: string;
    title_count: string;
    copy_button: string;
    copied_button: string;
    regenerate_button: string;
    clear_button: string;
    save_to_history: string;
    loading: string;
    empty_state: string;
  };
  history: {
    title: string;
    empty: string;
    clear_all: string;
    item_prefix: string;
  };
  toasts: {
    error_no_description: string;
    error_no_genre: string;
    error_no_tone: string;
    error_description_too_short: string;
    error_generate_failed: string;
    success_generated: string;
    success_copied: string;
    success_saved: string;
    success_cleared: string;
  };
}
