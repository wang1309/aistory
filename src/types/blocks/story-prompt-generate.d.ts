export interface StoryPromptGenerate {
  header: {
    title: string;
    subtitle: string;
  };
  ui: {
    // Quick mode labels
    genre_label: string;
    genre_placeholder: string;
    length_label: string;
    length_placeholder: string;
    tone_label: string;
    tone_placeholder: string;
    language_label: string;
    language_placeholder: string;
    
    // Advanced mode labels
    advanced_options: string;
    worldview_label: string;
    protagonist_label: string;
    protagonist_placeholder: string;
    goal_label: string;
    goal_placeholder: string;
    conflict_label: string;
    conflict_placeholder: string;
    constraints_label: string;
    constraints_placeholder: string;
    audience_label: string;
    audience_placeholder: string;
    
    // Buttons
    generate_button: string;
    generating: string;
    refresh_button: string;
    copy_button: string;
    use_prompt_button: string;
    favorite_button: string;
    clear_button: string;
    
    // Output
    output_title: string;
    output_empty: string;
    prompt_count: string;
  };
  
  // Genre options
  genres: {
    fantasy: string;
    scifi: string;
    romance: string;
    thriller: string;
    mystery: string;
    horror: string;
    adventure: string;
    historical: string;
    urban: string;
    comedy: string;
    drama: string;
    xianxia: string;
  };
  
  // Length options
  lengths: {
    short: string;
    short_desc: string;
    medium: string;
    medium_desc: string;
    long: string;
    long_desc: string;
  };
  
  // Tone options
  tones: {
    light: string;
    healing: string;
    dark: string;
    passionate: string;
    realistic: string;
    suspenseful: string;
    romantic: string;
    epic: string;
  };
  
  // Worldview options
  worldviews: {
    realistic: string;
    near_future: string;
    high_fantasy: string;
    cultivation: string;
    cyberpunk: string;
    post_apocalyptic: string;
    steampunk: string;
    mythology: string;
  };
  
  // Conflict types
  conflicts: {
    person_vs_person: string;
    person_vs_society: string;
    person_vs_nature: string;
    person_vs_self: string;
    person_vs_fate: string;
    multi_conflict: string;
  };
  
  // Audience options
  audiences: {
    children: string;
    teen: string;
    young_adult: string;
    adult: string;
    mature: string;
    all_ages: string;
  };
  
  // AI Models
  ai_models: {
    fast: string;
    fast_description: string;
    standard: string;
    standard_description: string;
    creative: string;
    creative_description: string;
  };
  
  // Toast messages
  toasts: {
    copied: string;
    generation_failed: string;
    no_genre: string;
    prompt_generated: string;
  };
  
  // Sample prompts for inspiration
  sample_ideas: string[];
}
