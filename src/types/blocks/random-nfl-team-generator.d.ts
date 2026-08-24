import type {
  NflConference,
  NflDivision,
  NflScopeFilter,
  NflTeam,
} from "@/lib/nfl-teams";

export type NflDrawMode = "pick" | "shuffle" | "assign";

export interface NflOption {
  value: string;
  label: string;
}

export interface NflSectionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface NflSection {
  name: string;
  label?: string;
  title: string;
  description?: string;
  items?: NflSectionItem[];
}

export interface NflContinuation {
  title: string;
  description?: string;
  squad_name_label: string;
  squad_name_hint: string;
  backstory_label: string;
  backstory_hint: string;
  prompt_label: string;
  prompt_hint: string;
}

export interface RandomNflTeamGeneratorPage {
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
  ui: {
    title: string;
    title_highlight?: string;
    subtitle: string;
    theme_pills?: string[];
    eyebrow: string;
    breadcrumb_home: string;
    breadcrumb_current: string;
    form_title: string;
    mode_label: string;
    mode_options: NflOption[];
    mode_hints: Record<NflDrawMode, string>;
    scope_label: string;
    scope_options: NflOption[];
    count_label: string;
    pick_button: string;
    shuffle_button: string;
    assign_button: string;
    reroll_button: string;
    participants_label: string;
    participants_placeholder: string;
    participants_hint: string;
    output_title: Record<NflDrawMode, string>;
    empty_output: string;
    result_label: string;
    eligible_label: string;
    participant_header: string;
    team_header: string;
    copy_button: string;
    copy_team_button: string;
    conference_badge: Record<NflConference, string>;
    division_badge: Record<NflDivision, string>;
    share_mode_label: string;
    share_filter_label: string;
    disclaimer: string;
  };
  validation: {
    no_teams: string;
    participants_empty: string;
    participants_too_many: string;
    generic_error: string;
  };
  success: {
    picked: string;
    shuffled: string;
    assigned: string;
    copied: string;
  };
  continuation: NflContinuation;
  feature1?: NflSection;
  how_to_use?: NflSection;
  feature2?: NflSection;
  feature3?: NflSection;
  faq?: NflSection;
  cta?: {
    name?: string;
    title: string;
    description?: string;
    buttons?: Array<{ title: string; url: string; icon?: string }>;
  };
  related_tools: {
    title: string;
    description?: string;
    more_label: string;
  };
}

/** Scope applied to the 32-team dataset at the moment of a draw. */
export interface NflDrawResult {
  mode: NflDrawMode;
  scope: NflScopeFilter;
  teams: NflTeam[];
  participants: string[];
}
