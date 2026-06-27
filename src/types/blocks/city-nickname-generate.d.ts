export interface CityNicknameGenerateSectionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface CityNicknameGenerateSection {
  name: string;
  label?: string;
  title: string;
  description?: string;
  items?: CityNicknameGenerateSectionItem[];
}

export interface CityNicknameGeneratePage {
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
  ui: Record<string, unknown>;
  validation: Record<string, string>;
  success: Record<string, string>;
  errors?: Record<string, string>;
  random_prompts?: Array<Record<string, unknown>>;
  feature1?: CityNicknameGenerateSection;
  how_to_use?: CityNicknameGenerateSection;
  feature2?: CityNicknameGenerateSection;
  feature3?: CityNicknameGenerateSection;
  faq?: CityNicknameGenerateSection;
  cta?: CityNicknameGenerateSection;
}
