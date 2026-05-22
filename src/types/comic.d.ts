export interface ComicCharacter {
  name: string;
  personality?: string;
  role?: string;
}

export interface ComicGenerateOptions {
  prompt: string;
  model: "fast" | "standard" | "creative";
  locale: string;
  characters?: ComicCharacter[];
  comicStyle?: string;
  panelCount?: string;
  tone?: string;
  setting?: string;
  narrationMode?: string;
  sceneGoal?: string;
  readingFormat?: string;
}

export interface ComicGenerateRequest extends ComicGenerateOptions {
  turnstileToken: string;
}
