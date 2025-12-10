export interface HeroPoemTitle {
    breadcrumb: {
        home: string;
        current: string;
    };
    header: {
        title: string;
        subtitle: string;
        meta_title: string;
        meta_description: string;
    };
    form: {
        poem_content: {
            label: string;
            required: string;
            placeholder: string;
            helper_text: string;
            max_length: number;
        };
        language: {
            label: string;
            placeholder: string;
            options: {
                [key: string]: string;
            };
        };
        style: {
            label: string;
            chips: {
                classical: string;
                modern: string;
                minimalist: string;
                imagist: string;
                dark: string;
                healing: string;
                romantic: string;
            };
        };
        mood: {
            label: string;
            chips: {
                sad: string;
                melancholic: string;
                calm: string;
                gentle: string;
                hopeful: string;
                angry: string;
                surreal: string;
            };
        };
        length: {
            label: string;
            options: {
                short: string;
                medium: string;
                long: string;
            };
        };
        usage_scene: {
            label: string;
            placeholder: string;
            options: {
                literary_submission: string;
                collection: string;
                social_media: string;
                competition: string;
                gift_card: string;
            };
        };
        random_button?: string;
        examples?: {
            title: string;
            prompts: string[];
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
        literary_group_title: string;
        platform_group_title: string;
        explanation_label: string;
        copy_button: string;
        copied_button: string;
        regenerate_button: string;
        clear_button: string;
        loading: string;
        empty_state: string;
    };
    toasts: {
        error_no_content: string;
        error_content_too_short: string;
        error_generate_failed: string;
        success_generated: string;
        success_copied: string;
    };
}
