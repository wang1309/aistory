import { z } from "zod";

export const OC_MODES = ["general", "rpg", "anime"] as const;
export const OC_OPERATIONS = ["concepts", "profile", "reroll"] as const;

export type OcMode = (typeof OC_MODES)[number];
export type OcGenerationOperation = (typeof OC_OPERATIONS)[number];

export type OcInput = {
  mode: OcMode;
  world: string;
  role: string;
  constraints: string;
  locale: string;
};

export type OcIdentity = {
  name: string;
  aliases: string[];
  age: string;
  pronouns: string;
  role: string;
  species: string;
};

export type OcConcept = {
  id: string;
  name: string;
  premise: string;
  visualHook: string;
  personalityHook: string;
  conflictHook: string;
};

export type OcProfile = {
  identity: OcIdentity;
  appearance: string;
  personality: string;
  desire: string;
  flaw: string;
  secret: string;
  relationships: string[];
  conflict: string;
  storyHooks: string[];
  visualPrompt: string;
};

/**
 * Bounded tuple of every profile field that may be rerolled. The API only ever
 * accepts these top-level keys, never arbitrary object paths.
 */
export const OC_REROLL_FIELDS = [
  "identity",
  "appearance",
  "personality",
  "desire",
  "flaw",
  "secret",
  "relationships",
  "conflict",
  "storyHooks",
  "visualPrompt",
] as const;

export type OcRerollField = (typeof OC_REROLL_FIELDS)[number];

const ocInputFields = {
  mode: z.enum(OC_MODES),
  world: z.string().trim().max(160),
  role: z.string().trim().max(100),
  constraints: z.string().trim().max(1200),
  locale: z.string().trim().min(2).max(10),
};

export const ocInputSchema = z.object(ocInputFields);

export const ocIdentitySchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()).catch(() => []),
  age: z.string(),
  pronouns: z.string(),
  role: z.string(),
  species: z.string(),
});

export const ocConceptSchema = z.object({
  id: z.string(),
  name: z.string(),
  premise: z.string(),
  visualHook: z.string(),
  personalityHook: z.string(),
  conflictHook: z.string(),
});

export const ocProfileSchema = z.object({
  identity: ocIdentitySchema,
  appearance: z.string(),
  personality: z.string(),
  desire: z.string(),
  flaw: z.string(),
  secret: z.string(),
  relationships: z.array(z.string()).catch(() => []),
  conflict: z.string(),
  storyHooks: z.array(z.string()).catch(() => []),
  visualPrompt: z.string(),
});

/**
 * Partial profile used for reroll responses — every field is optional and the
 * model is only expected to return the regenerated subset.
 */
export const ocProfilePartialSchema = ocProfileSchema.partial();

/**
 * Operation-specific request schemas. The public UI never exposes a model
 * picker, so `model` is pinned to the internal `"creative"` key that activates
 * the existing page-scoped quota and credit flow.
 */
export const ocConceptsRequestSchema = z.object({
  operation: z.literal("concepts"),
  model: z.literal("creative"),
  turnstileToken: z.string(),
  ...ocInputFields,
});

export const ocProfileRequestSchema = z.object({
  operation: z.literal("profile"),
  model: z.literal("creative"),
  turnstileToken: z.string(),
  ...ocInputFields,
  concept: ocConceptSchema,
});

export const ocRerollRequestSchema = z.object({
  operation: z.literal("reroll"),
  model: z.literal("creative"),
  turnstileToken: z.string(),
  profile: ocProfileSchema,
  fields: z.array(z.enum([...OC_REROLL_FIELDS])),
  lockedFields: z.array(z.string()),
});

export type OcConceptsRequest = z.infer<typeof ocConceptsRequestSchema>;
export type OcProfileRequest = z.infer<typeof ocProfileRequestSchema>;
export type OcRerollRequest = z.infer<typeof ocRerollRequestSchema>;
