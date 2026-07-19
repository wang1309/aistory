export interface OcGenerateFaqItem {
  title: string;
  description: string;
}

/**
 * Page-content type for the OC generator. This is intentionally separate from
 * the `OcProfile` / `OcConcept` domain types in `src/lib/oc-schema.ts`: it only
 * describes the localized strings the workbench and SEO layer consume.
 */
export interface OcGenerate {
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
  ui: {
    title: string;
    subtitle: string;
    breadcrumb_home: string;
    breadcrumb_current: string;
    generate_concepts: string;
    select_concept: string;
    generate_profile: string;
    reroll_field: string;
    save_local: string;
    saved_local: string;
    history: string;
    export_markdown: string;
    export_json: string;
    copy_field: string;
    copy_profile: string;
    lock_field: string;
    unlock_field: string;
    delete_character: string;
    delete_confirm: string;
    restore_version: string;
    empty_history: string;
    continue_backstory: string;
    continue_story: string;
    continue_dnd: string;
    local_only_label: string;
    generating: string;
    concepts_step_title: string;
    profile_step_title: string;
    back: string;
    retry: string;
  };
  modes: {
    label: string;
    general: string;
    general_hint: string;
    rpg: string;
    rpg_hint: string;
    anime: string;
    anime_hint: string;
  };
  fields: {
    world: string;
    world_placeholder: string;
    role: string;
    role_placeholder: string;
    constraints: string;
    constraints_placeholder: string;
    identity: string;
    name: string;
    aliases: string;
    age: string;
    pronouns: string;
    species: string;
    appearance: string;
    personality: string;
    desire: string;
    flaw: string;
    secret: string;
    relationships: string;
    conflict: string;
    storyHooks: string;
    visualPrompt: string;
    premise: string;
    visualHook: string;
    personalityHook: string;
    conflictHook: string;
  };
  role_presets: string[];
  world_presets: string[];
  placeholders: {
    world: string;
    role: string;
    constraints: string;
  };
  output: {
    pending_concepts: string;
    pending_profile: string;
    pending_reroll: string;
    concepts_empty: string;
  };
  errors: {
    concepts_failed: string;
    profile_failed: string;
    reroll_failed: string;
    verification_failed: string;
    generic: string;
  };
  success: {
    concepts_ready: string;
    profile_ready: string;
    reroll_applied: string;
    saved_local: string;
    copied: string;
    handed_off_backstory: string;
    handed_off_story: string;
    handed_off_dnd: string;
  };
  faq_items: OcGenerateFaqItem[];
}
