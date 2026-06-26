import { Section } from "@/types/blocks/section";

export interface PlotGenerate {
  random_prompts: string[];
  ui?: {
    theme_pills?: string[];
    [key: string]: unknown;
  };
  feature_section?: Section;
  feature1_section?: Section;
  feature3_section?: Section;
  completion_guide: {
    title: string;
    subtitle: string;
    create_another: string;
    share_action: string;
    continue_label: string;
  };
}
