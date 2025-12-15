export interface DialogueCharacter {
  name: string;
  personality?: string;
  role?: string;
}

export interface DialogueGenerateOptions {
  prompt: string;
  model: "fast" | "standard" | "creative";
  locale: string;
  characters?: DialogueCharacter[];
  dialogueType?: string;
  tone?: string;
  length?: string;
  setting?: string;
  includeNarration?: boolean;
}

export interface DialogueGenerateRequest extends DialogueGenerateOptions {
  turnstileToken: string;
}
