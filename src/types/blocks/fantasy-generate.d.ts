/**
 * Fantasy Story Generator Types
 * 奇幻故事生成器类型定义
 */

export interface FantasyGenerate {
  header: {
    title: string;
    subtitle: string;
    meta_title: string;
    meta_description: string;
  };
  breadcrumb: {
    home: string;
    current: string;
  };
  // 模式切换
  mode_tabs: {
    quick: string;
    worldbuilder: string;
  };
  // 快速模式
  quick_mode: {
    prompt: {
      label: string;
      placeholder: string;
      required: string;
      character_counter: string;
    };
    subgenre: {
      label: string;
      placeholder: string;
      options: {
        high_fantasy: string;
        urban_fantasy: string;
        eastern_fantasy: string;
        xianxia: string;
        dark_fantasy: string;
        comedic_fantasy: string;
        steampunk: string;
        epic_fantasy: string;
      };
    };
    tone: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        lighthearted: string;
        healing: string;
        epic: string;
        dark: string;
        tragic: string;
        passionate: string;
      };
    };
    audience: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        children: string;
        teens: string;
        adults: string;
      };
    };
    length: {
      label: string;
      placeholder: string;
      options: {
        opening: string;
        short: string;
        medium_outline: string;
      };
    };
    perspective: {
      label: string;
      placeholder: string;
      options: {
        none: string;
        first_person: string;
        third_person_limited: string;
        omniscient: string;
      };
    };
  };
  // 世界观向导模式
  worldbuilder_mode: {
    steps: {
      subgenre: {
        title: string;
        description: string;
      };
      setting: {
        title: string;
        description: string;
      };
      magic_system: {
        title: string;
        description: string;
      };
      characters: {
        title: string;
        description: string;
      };
      plot: {
        title: string;
        description: string;
      };
    };
    // Step 1: 子类型
    subgenre: {
      label: string;
      placeholder: string;
      options: {
        high_fantasy: string;
        urban_fantasy: string;
        eastern_fantasy: string;
        xianxia: string;
        dark_fantasy: string;
        comedic_fantasy: string;
        steampunk: string;
        epic_fantasy: string;
      };
    };
    // Step 2: 世界背景
    setting: {
      era: {
        label: string;
        placeholder: string;
        options: {
          medieval: string;
          modern: string;
          future: string;
          ancient: string;
          mixed: string;
        };
      };
      world_overview: {
        label: string;
        placeholder: string;
      };
      factions: {
        label: string;
        placeholder: string;
      };
    };
    // Step 3: 魔法系统
    magic_system: {
      source: {
        label: string;
        placeholder: string;
        options: {
          innate: string;
          bloodline: string;
          cultivation: string;
          contract: string;
          technology: string;
          divine: string;
        };
      };
      cost: {
        label: string;
        placeholder: string;
      };
      limitations: {
        label: string;
        placeholder: string;
      };
    };
    // Step 4: 角色设定
    characters: {
      protagonist: {
        label: string;
        name: {
          label: string;
          placeholder: string;
        };
        race_class: {
          label: string;
          placeholder: string;
        };
        personality: {
          label: string;
          placeholder: string;
        };
        background: {
          label: string;
          placeholder: string;
        };
        goal: {
          label: string;
          placeholder: string;
        };
      };
      antagonist: {
        label: string;
        name: {
          label: string;
          placeholder: string;
        };
        motivation: {
          label: string;
          placeholder: string;
        };
        relationship: {
          label: string;
          placeholder: string;
        };
      };
    };
    // Step 5: 剧情
    plot: {
      main_quest: {
        label: string;
        placeholder: string;
      };
      key_events: {
        label: string;
        placeholder: string;
      };
      twists: {
        label: string;
        placeholder: string;
      };
    };
  };
  // AI 模型选择
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
  };
  // 生成按钮
  generate_button: {
    text: string;
    generating: string;
    tip: string;
  };
  // 输出区域
  output: {
    tabs: {
      story: string;
      worldview: string;
      characters: string;
      outline: string;
    };
    title: string;
    status_writing: string;
    status_complete: string;
    word_count: string;
    button_copy: string;
    button_export_pdf: string;
    button_exporting_pdf: string;
    button_regenerate: string;
    button_send_to_workspace: string;
    loading: string;
  };
  // 导航按钮
  navigation: {
    next: string;
    previous: string;
    generate: string;
  };
  // Toast 消息
  toasts: {
    error_no_prompt: string;
    error_no_subgenre: string;
    error_no_model: string;
    error_generate_failed: string;
    error_no_stream: string;
    error_no_content: string;
    success_generated: string;
    success_copied: string;
  };
  // UI 文本
  ui: {
    required: string;
    optional: string;
    speed_icon: string;
  };
}

// API 请求类型
export interface FantasyGenerateRequest {
  mode: 'quick' | 'worldbuilder';
  // 快速模式参数
  prompt?: string;
  subgenre: string;
  tone?: string;
  audience?: string;
  length?: string;
  perspective?: string;
  // 世界观模式参数
  setting?: {
    era?: string;
    worldOverview?: string;
    factions?: string;
  };
  magicSystem?: {
    source?: string;
    cost?: string;
    limitations?: string;
  };
  protagonist?: {
    name?: string;
    raceClass?: string;
    personality?: string;
    background?: string;
    goal?: string;
  };
  antagonist?: {
    name?: string;
    motivation?: string;
    relationship?: string;
  };
  plot?: {
    mainQuest?: string;
    keyEvents?: string;
    twists?: string;
  };
  // 通用参数
  model: string;
  locale: string;
  outputLanguage: string;
  turnstileToken: string;
}

// API 响应类型
export interface FantasyGenerateResponse {
  story: string;
  worldview?: string;
  characters?: string;
  outline?: string;
}

// 本地存储类型
export interface SavedFantasyStory {
  id: string;
  title: string;
  mode: 'quick' | 'worldbuilder';
  subgenre: string;
  prompt?: string;
  content: string;
  worldview?: string;
  characters?: string;
  outline?: string;
  wordCount: number;
  model: string;
  createdAt: string;
}
