export interface ChangelogChange {
  type: "feature" | "fix" | "improvement" | "security";
  items: string[];
}

export interface ChangelogItem {
  version: string;
  date: string;
  changes: ChangelogChange[];
}

export interface Changelog {
  disabled?: boolean;
  name?: string;
  title?: string;
  description?: string;
  label?: string;
  items?: ChangelogItem[];
}
