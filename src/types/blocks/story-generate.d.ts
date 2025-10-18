export interface StoryGenerate {
  header: {
    title: string;
    subtitle: string;
  };
  prompt: {
    label: string;
    required: string;
    placeholder: string;
    random_button: string;
    quick_adds_label: string;
    quick_add_chips: {
      plot_twist: string;
      dialogue: string;
      setting: string;
    };
    character_counter: string;
  };
  random_prompts: string[];
  presets: {
    title: string;
    items: {
      fantasy_quest: {
        title: string;
        desc: string;
        template: string;
      };
      scifi_thriller: {
        title: string;
        desc: string;
        template: string;
      };
      love_story: {
        title: string;
        desc: string;
        template: string;
      };
      crime_mystery: {
        title: string;
        desc: string;
        template: string;
      };
    };
  };
  ai_models: {
    title: string;
    hint: string;
    models: {
      fastest: {
        name: string;
        badge: string;
        description: string;
        speed: string;
      };
      eloquent: {
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
    };
    selected: string;
    select: string;
  };
  advanced_options: {
    title: string;
    subtitle: string;
    optional_badge: string;
    format: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        prose: string;
        screenplay: string;
        short_story: string;
        letter: string;
        diary: string;
        fairy_tale: string;
        myth: string;
        fable: string;
        poem: string;
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
    genre: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        fantasy: string;
        science_fiction: string;
        romance: string;
        thriller: string;
        drama: string;
        comedy: string;
        action: string;
        western: string;
        crime: string;
        science: string;
        fiction: string;
        non_fiction: string;
        mystery: string;
        biography: string;
        self_help: string;
        horror: string;
        adventure: string;
        historical: string;
      };
    };
    perspective: {
      label: string;
      placeholder: string;
      options: {
        first_person: string;
        second_person: string;
        third_person_limited: string;
        third_person_omniscient: string;
      };
    };
    audience: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        kids: string;
        pre_teen: string;
        teens: string;
        young_adults: string;
        adults: string;
        mature_audience: string;
        general: string;
        families: string;
        educators: string;
        writers_author: string;
      };
    };
    tone: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        hopeful: string;
        dark: string;
        romantic: string;
        suspenseful: string;
        inspirational: string;
        funny: string;
        dramatic: string;
        whimsical: string;
        tragic: string;
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
    story_format: string;
    story_genre: string;
    story_tone: string;
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
    error_no_prompt: string;
    error_no_model: string;
    error_generate_failed: string;
    error_no_stream: string;
    error_no_content: string;
    error_pdf_export_failed: string;
    success_generated: string;
    success_copied: string;
    success_pdf_exported: string;
  };
}