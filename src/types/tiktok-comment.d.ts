export type TiktokCommentReplyGoal =
  | "thank_you"
  | "answer_question"
  | "clarify_misunderstanding"
  | "drive_engagement"
  | "handle_negative";

export type TiktokCommentTone =
  | "warm"
  | "professional"
  | "funny"
  | "sales"
  | "empathetic";

export type TiktokCommentLength = "short" | "medium" | "long";

export type TiktokCommentModelMode = "fast" | "standard" | "creative";

export interface TiktokCommentPromptOptions {
  comment: string;
  context: string;
  replyGoal: TiktokCommentReplyGoal;
  tone: TiktokCommentTone;
  length: TiktokCommentLength;
  outputLanguage: string;
  mode: TiktokCommentModelMode;
}

export interface NormalizedTiktokCommentRequest extends TiktokCommentPromptOptions {
  locale: string;
}

export interface TiktokCommentGenerateRequest {
  comment?: string;
  context?: string;
  replyGoal?: TiktokCommentReplyGoal;
  tone?: TiktokCommentTone;
  length?: TiktokCommentLength;
  outputLanguage?: string;
  locale?: string;
  mode?: TiktokCommentModelMode;
}

export interface TiktokCommentGenerateRouteRequest
  extends TiktokCommentGenerateRequest {
  turnstileToken?: string;
}
