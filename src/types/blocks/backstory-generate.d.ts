export interface BackstoryGenerate {
    ui: {
        title: string;
        subtitle: string;
        breadcrumb_home: string;
        breadcrumb_current: string;
        character_concept: string;
        random_button: string;
        ai_model: string;
        output_language: string;
        worldview: string;
        role_type: string;
        output_length: string;
        advanced_options: string;
        tone: string;
        generate_button: string;
        generating: string;
    };
    placeholders: {
        character_concept: string;
        select_ai_model: string;
    };
    ai_models: {
        fast: string;
        fast_description: string;
        standard: string;
        standard_description: string;
        creative: string;
        creative_description: string;
    };
    worldview: {
        fantasy: string;
        scifi: string;
        urban: string;
        xianxia: string;
        historical: string;
        campus: string;
        dnd: string;
        cyberpunk: string;
    };
    role_type: {
        protagonist: string;
        supporting: string;
        antagonist: string;
        npc: string;
        vtuber: string;
    };
    length: {
        short: string;
        short_description: string;
        medium: string;
        medium_description: string;
        detailed: string;
        detailed_description: string;
    };
    tone: {
        dark: string;
        inspirational: string;
        comedic: string;
        tragic: string;
        epic: string;
    };
    output: {
        title: string;
        words: string;
        copy: string;
        generating_message: string;
        empty_message: string;
    };
    validation: {
        enter_concept: string;
        select_ai_model: string;
    };
    success: {
        random_prompt_selected: string;
        backstory_generated: string;
        backstory_copied: string;
    };
    errors: {
        generation_failed: string;
    };
    random_prompts: string[];
}
