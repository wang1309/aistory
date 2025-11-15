import { Section } from "./section";

export interface PoemGenerate {
  header: {
    title: string;
    subtitle: string;
  };
  mode: {
    simple: string;
    advanced: string;
    toggle_hint: string;
    simple_description: string;
    advanced_description: string;
    keyboard_shortcut: string;
    toggle_shortcut: string;
  };
  prompt: {
    label: string;
    required: string;
    placeholder: string;
    random_button: string;
    quick_adds_label: string;
    quick_add_chips: {
      emotions: string[];
      imagery: string[];
      scenes: string[];
    };
    language_label: string;
    language_placeholder: string;
    language_options: {
      [key: string]: {
        native: string;
        english: string;
        flag: string;
      };
    };
    character_counter: string;
  };
  random_prompts: string[];
  poem_types: {
    title: string;
    tabs: {
      modern: {
        name: string;
        description: string;
      };
      classical: {
        name: string;
        description: string;
      };
      format: {
        name: string;
        description: string;
      };
      lyric: {
        name: string;
        description: string;
      };
    };
  };
  ai_models: {
    title: string;
    hint: string;
    models: {
      fast: {
        name: string;
        badge: string;
        description: string;
        speed: string;
      };
      standard: {
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
  options: {
    title: string;
    subtitle: string;
    length: {
      label: string;
      placeholder: string;
      options: {
        short: string;
        medium: string;
        long: string;
      };
    };
    rhyme_scheme: {
      label: string;
      placeholder: string;
      modern_options: {
        free: string;
        abab: string;
        aabb: string;
        abcb: string;
      };
      classical_options: {
        wujue: string; // 五言绝句
        qijue: string; // 七言绝句
        wulv: string; // 五言律诗
        qilv: string; // 七言律诗
        ci: string; // 词
      };
      format_options: {
        haiku: string; // 俳句
        free_verse: string; // 自由诗
        sonnet: string; // 十四行诗
        limerick: string; // 打油诗
        acrostic: string; // 藏头诗
        love_poem: string; // 情诗
        line_by_line: string; // 逐行诗
        rhyming_couplets: string; // 对联/押韵对句
        villanelle: string; // 维拉内拉诗
      };
      lyric_options: {
        verse_chorus: string; // 主歌+副歌
        verse_bridge_chorus: string; // 主歌+过渡+副歌
      };
    };
    cipai: {
      label: string;
      placeholder: string;
      popular: {
        niannujiao: string;
        qinyuanchun: string;
        shuidiaogetou: string;
        yulinling: string;
        xijiangYue: string;
        ruanlanggui: string;
        yijiangnan: string;
        pusalian: string;
      };
    };
    theme: {
      label: string;
      placeholder: string;
      none_option: string;
      options: {
        love: string;
        nature: string;
        philosophy: string;
        inspiration: string;
        life: string;
        nostalgia: string;
        friendship: string;
        family: string;
        society: string;
        history: string;
      };
    };
    mood: {
      label: string;
      placeholder: string;
      none_option: string;
      options: {
        joyful: string;
        melancholic: string;
        passionate: string;
        peaceful: string;
        romantic: string;
        contemplative: string;
        hopeful: string;
        sorrowful: string;
      };
    };
    style: {
      label: string;
      placeholder: string;
      none_option: string;
      options: {
        romantic: string;
        realism: string;
        symbolism: string;
        surrealism: string;
        minimalism: string;
        impressionism: string;
        modernism: string;
        classical: string;
      };
    };
    strict_tone: {
      label: string;
      description: string;
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
    tabs: {
      poem: string;
      analysis: string;
      audio: string;
    };
    status_writing: string;
    status_complete: string;
    line_count: string;
    button_copy: string;
    button_export_pdf: string;
    button_exporting_pdf: string;
    button_regenerate: string;
    button_analyze: string;
    button_analyzing: string;
    button_generate_audio: string;
    button_generating_audio: string;
    loading: string;
  };
  analysis: {
    title: string;
    imagery: {
      title: string;
      description: string;
    };
    rhyme: {
      title: string;
      description: string;
    };
    rhetoric: {
      title: string;
      description: string;
    };
    emotion: {
      title: string;
      description: string;
    };
    theme: {
      title: string;
      description: string;
    };
    loading: string;
    no_analysis: string;
    error: string;
  };
  audio: {
    title: string;
    no_audio: string;
    error: string;
    player: {
      play: string;
      pause: string;
      stop: string;
      resume: string;
      download: string;
      speed: string;
      speed_label: string;
      status_reading: string;
      status_paused: string;
    };
    browser_not_supported: string;
    tts_failed: string;
  };
  pdf: {
    generated_at: string;
    line_count_label: string;
    ai_model: string;
    poem_type: string;
    poem_theme: string;
    poem_mood: string;
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
  history: {
    title: string;
    empty: string;
    load: string;
    delete: string;
    clear_all: string;
    confirm_clear: string;
  };
  toasts: {
    error_no_prompt: string;
    error_no_model: string;
    error_generate_failed: string;
    error_no_stream: string;
    error_no_content: string;
    error_analyze_failed: string;
    error_tts_failed: string;
    error_pdf_export_failed: string;
    error_generate_poem_first: string;
    success_generated: string;
    success_copied: string;
    success_analyzed: string;
    success_audio_generated: string;
    success_pdf_exported: string;
  };
  feature1_section?: Section;
  feature_section?: Section;
  feature3_section?: Section;
  poem_applications_section?: Section;
  testimonial_section?: Section;
}
