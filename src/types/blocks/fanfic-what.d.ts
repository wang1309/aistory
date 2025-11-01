export interface FanficWhat {
  disabled?: boolean;
  name?: string;
  label?: string;
  title?: string;
  subtitle?: string;
  content?: string;  // Rich text content with line breaks and formatting
  intro_paragraph?: string;  // Legacy field, kept for backward compatibility
}
