export type StoryOutlineGenre =
  | "fantasy"
  | "romance"
  | "thriller"
  | "sci-fi"
  | "mystery"
  | "literary"
  | "general";

export type StoryOutlineTone =
  | "hopeful"
  | "dark"
  | "funny"
  | "emotional"
  | "tense"
  | "epic";

export type StoryOutlineTargetLength = "short-story" | "novella" | "novel";

export type StoryOutlineAudience = "kids" | "middle-grade" | "ya" | "adult";

export interface StoryOutlineGenerateRequest {
  storyIdea?: string;
  genre?: StoryOutlineGenre;
  tone?: StoryOutlineTone;
  targetLength?: StoryOutlineTargetLength;
  audience?: StoryOutlineAudience;
  locale?: string;
  turnstileToken?: string;
}

export interface StoryOutlineCoreConflict {
  protagonistGoal: string;
  opposition: string;
  stakes: string;
  urgency: string;
}

export interface StoryOutlineArc {
  opening: string;
  escalation: string;
  midpoint: string;
  crisis: string;
  climax: string;
  resolution: string;
}

export interface StoryOutlineBeat {
  label: string;
  summary: string;
  purpose: string;
}

export interface GeneratedStoryOutline {
  premise: string;
  coreConflict: StoryOutlineCoreConflict;
  storyArc: StoryOutlineArc;
  keyBeats: StoryOutlineBeat[];
  nextStepTeaser: string;
}

export interface StoryOutlineGenerateResponse {
  outline: GeneratedStoryOutline;
}

export interface StoryOutlineExpandRequest {
  outline?: GeneratedStoryOutline;
  chapterCount?: number;
  locale?: string;
}

export interface StoryOutlineChapter {
  number: number;
  title: string;
  purpose: string;
  summary: string;
  conflict: string;
  endingHook: string;
}

export interface StoryOutlineChapterPlan {
  chapterCount: number;
  chapters: StoryOutlineChapter[];
}

export interface StoryOutlineExpandResponse extends StoryOutlineChapterPlan {
  creditsCharged: number;
}
