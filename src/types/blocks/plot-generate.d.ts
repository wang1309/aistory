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
}
