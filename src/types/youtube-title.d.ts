export type YoutubeTitleAngle =
  | "search-first"
  | "curiosity-first"
  | "outcome-first"
  | "contrarian-first";

export type YoutubeTitleLengthPreference = "short" | "medium" | "flexible";

export type YoutubeTitleOptimizationPreference =
  | "search"
  | "balanced"
  | "clicks";

export type YoutubeTitleRisk = "low" | "medium" | "high";

export type YoutubeTitleKeywordPlacement =
  | "front-loaded"
  | "mid-title"
  | "late"
  | "none";

export interface YoutubeTitleGenerateRequest {
  videoTopic?: string;
  targetAudience?: string;
  summary?: string;
  transcript?: string;
  titleLengthPreference?: YoutubeTitleLengthPreference;
  optimizationPreference?: YoutubeTitleOptimizationPreference;
  avoidWords?: string[];
}

export interface YoutubeTitleGenerateRouteRequest
  extends YoutubeTitleGenerateRequest {
  turnstileToken?: string;
  locale?: string;
}

export interface NormalizedYoutubeTitleRequest {
  videoTopic: string;
  targetAudience: string;
  summary: string;
  transcript: string;
  titleLengthPreference: YoutubeTitleLengthPreference;
  optimizationPreference: YoutubeTitleOptimizationPreference;
  avoidWords: string[];
  locale: string;
}

export interface GeneratedYoutubeTitle {
  title: string;
  angle: YoutubeTitleAngle;
  characterCount: number;
  truncationRisk: YoutubeTitleRisk;
  keywordPlacement: YoutubeTitleKeywordPlacement;
  authenticityRisk: YoutubeTitleRisk;
  oneLineReason: string;
  bestUseCase: string;
}

export interface YoutubeTitleGenerateResponse {
  titles: GeneratedYoutubeTitle[];
  recommendedTitle: string;
  recommendedReason: string;
  backupTitle: string;
}
