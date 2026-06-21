export type YoutubeNameStyle =
  | "brandable"
  | "searchable"
  | "hybrid"
  | "funny"
  | "personal"
  | "expert"
  | "cinematic";

export type YoutubeNameLengthPreference = "short" | "medium" | "flexible";

export type YoutubeNamePivotFlexibility = "low" | "medium" | "high";

export type YoutubeNameCategory = "brandable" | "searchable" | "hybrid";

export interface YoutubeNameScores {
  memorability: number;
  pronounceability: number;
  uniqueness: number;
  pivotFlexibility: number;
}

export interface YoutubeNameHandleValidation {
  formatValid: boolean;
  warnings: string[];
  fallbackHandles: string[];
}

export interface GeneratedYoutubeName {
  name: string;
  suggestedHandle: string;
  category: YoutubeNameCategory;
  oneLineRationale: string;
  bestFor: string;
  scores: YoutubeNameScores;
  handleValidation: YoutubeNameHandleValidation;
}

export interface YoutubeNamePromptOptions {
  niche: string;
  audience: string;
  style: YoutubeNameStyle;
  lengthPreference: YoutubeNameLengthPreference;
  pivotFlexibility: YoutubeNamePivotFlexibility;
  keywords: string[];
  creatorName: string;
  outputLanguage: string;
}

export interface NormalizedYoutubeNameRequest extends YoutubeNamePromptOptions {
  locale: string;
}

export interface YoutubeNameGenerateRequest {
  niche?: string;
  audience?: string;
  style?: YoutubeNameStyle;
  lengthPreference?: YoutubeNameLengthPreference;
  pivotFlexibility?: YoutubeNamePivotFlexibility;
  keywords?: string[];
  creatorName?: string;
  outputLanguage?: string;
  locale?: string;
}

export interface YoutubeNameGenerateResponse {
  names: GeneratedYoutubeName[];
  recommendedName: string;
  recommendedReason: string;
}

export interface YoutubeNameGenerateRouteRequest
  extends YoutubeNameGenerateRequest {
  turnstileToken?: string;
}
