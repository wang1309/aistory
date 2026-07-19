import { z } from "zod";

import {
  OC_MODES,
  ocConceptSchema,
  ocProfilePartialSchema,
  ocProfileSchema,
  type OcConcept,
  type OcGenerationOperation,
  type OcInput,
  type OcProfile,
} from "@/lib/oc-schema";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Simplified Chinese (简体中文)",
  ja: "Japanese (日本語)",
  ko: "Korean (한국어)",
  de: "German (Deutsch)",
  ru: "Russian (Русский)",
};

function languageName(locale: string): string {
  const key = (locale || "en").slice(0, 2).toLowerCase();
  return LANGUAGE_NAMES[key] ?? "English";
}

/**
 * Coerce raw user input into a safe, typed OcInput. Unknown modes collapse to
 * the general preset and a missing locale defaults to English so prompt
 * construction never throws.
 */
export function normalizeOcRequest(input: Partial<OcInput>): OcInput {
  const rawMode = input.mode ?? "";
  const mode = (OC_MODES as readonly string[]).includes(rawMode)
    ? (rawMode as OcInput["mode"])
    : "general";

  return {
    mode,
    world: (input.world ?? "").trim(),
    role: (input.role ?? "").trim(),
    constraints: (input.constraints ?? "").trim(),
    locale: (input.locale ?? "").trim() || "en",
  };
}

function modeGuidance(mode: OcInput["mode"]): string {
  switch (mode) {
    case "rpg":
      return "Mode: tabletop RPG / game character — lean toward stats-friendly archetypes, factions, and playable hooks.";
    case "anime":
      return "Mode: anime / light-novel character — lean toward striking visual motifs and genre-forward personalities.";
    default:
      return "Mode: general original character for writers.";
  }
}

const ORIGINALITY_RULE =
  "Every name, trait, and hook must be original. Never copy or closely resemble any copyrighted, trademarked, or real person/character.";

const PROFILE_SHAPE = `{
  "identity": {
    "name": "string",
    "aliases": ["string"],
    "age": "string (e.g. 'late 20s')",
    "pronouns": "string (e.g. 'she/her')",
    "role": "string",
    "species": "string"
  },
  "appearance": "string — concrete, sensory description",
  "personality": "string — 2-3 sentences with texture, not adjectives alone",
  "desire": "string — what they actively want",
  "flaw": "string — the specific weakness that creates trouble",
  "secret": "string — something they hide",
  "relationships": ["string — one key relationship per entry"],
  "conflict": "string — the dramatic tension driving them",
  "storyHooks": ["string — concrete scene-sized hooks a writer can open on"],
  "visualPrompt": "string — a concise image-generation prompt for this character"
}`;

export function buildOcPrompt(args: {
  operation: OcGenerationOperation;
  input: OcInput;
  concept?: OcConcept;
  profile?: OcProfile;
  fields?: string[];
  lockedFields?: string[];
}): string {
  const { operation, input, concept, profile, fields, lockedFields } = args;
  const lang = languageName(input.locale);
  const constraintsLine = input.constraints
    ? `Hard constraints (never violate them): ${input.constraints}`
    : "";

  const header = [
    "You are an elite character designer for novelists, roleplayers, and game masters.",
    modeGuidance(input.mode),
    `World / setting: ${input.world || "(open — invent something fitting)"}`,
    `Character role: ${input.role || "(open — invent something fitting)"}`,
    `Write every natural-language value in: ${lang}.`,
    ORIGINALITY_RULE,
    constraintsLine,
    "Output JSON only. No prose, no commentary, no markdown except the single JSON block.",
  ]
    .filter(Boolean)
    .join("\n");

  if (operation === "concepts") {
    return `${header}

Generate THREE distinct original character concepts that fit the world and role above. Each concept needs a different core archetype so the writer has real variety to choose from.

Return JSON with this exact shape:
{
  "concepts": [
    {
      "id": "c1",
      "name": "string",
      "premise": "string — one sentence elevator pitch",
      "visualHook": "string — the single most memorable visual detail",
      "personalityHook": "string — the core trait that drives scenes",
      "conflictHook": "string — the specific, dramatic problem they walk into"
    },
    { "id": "c2", ... },
    { "id": "c3", ... }
  ]
}

The conflictHook field is mandatory and must be specific (a person, a choice, a deadline), never generic filler. Output JSON only.`;
  }

  if (operation === "profile") {
    const conceptBlock = concept
      ? [
          "Expand this chosen concept into a full original character profile:",
          `Concept name: ${concept.name}`,
          `Premise: ${concept.premise}`,
          `Visual hook: ${concept.visualHook}`,
          `Personality hook: ${concept.personalityHook}`,
          `Conflict hook: ${concept.conflictHook}`,
        ].join("\n")
      : "Invent an original character profile that fits the world and role above.";

    return `${header}

${conceptBlock}

Return JSON only with this exact shape — every field is required:
${PROFILE_SHAPE}

storyHooks must contain at least three concrete, scene-sized entry points. visualPrompt must be a self-contained image prompt. Output JSON only.`;
  }

  // reroll
  const targetFields = (fields ?? []).length
    ? fields!.join(", ")
    : "a single field you think is weakest";
  const locked = lockedFields ?? [];
  const lockedBlock = locked.length
    ? `Locked fields — return them UNCHANGED if you mention them at all: ${locked.join(", ")}.`
    : "No fields are locked.";
  const profileJson = JSON.stringify(profile);

  return `${header}

You are regenerating selected fields of an existing character to give the writer a fresh option.

Current profile (JSON):
${profileJson}

Regenerate ONLY these fields: ${targetFields}.
${lockedBlock}

Return JSON only containing ONLY the regenerated fields with brand-new values. Do not echo fields you were not asked to change. Output JSON only.`;
}

/**
 * Pull a JSON value out of a model response that may be raw JSON, fenced JSON,
 * or surrounded by stray prose. Throws if no JSON object/array can be located.
 */
function extractJson(raw: string): unknown {
  const trimmed = (raw ?? "").trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : trimmed;

  const objStart = candidate.indexOf("{");
  const objEnd = candidate.lastIndexOf("}");
  const arrStart = candidate.indexOf("[");
  const arrEnd = candidate.lastIndexOf("]");

  const hasObject = objStart !== -1 && objEnd !== -1 && objEnd > objStart;
  const hasArray = arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart;

  if (hasObject && (!hasArray || objStart < arrStart)) {
    return JSON.parse(candidate.slice(objStart, objEnd + 1));
  }
  if (hasArray) {
    return JSON.parse(candidate.slice(arrStart, arrEnd + 1));
  }
  throw new Error("No JSON object or array found in model response");
}

export function parseOcModelResponse(
  raw: string,
  operation: OcGenerationOperation
): OcConcept[] | OcProfile | Partial<OcProfile> {
  const json = extractJson(raw);

  if (operation === "concepts") {
    const source = Array.isArray(json)
      ? json
      : Array.isArray((json as any)?.concepts)
        ? (json as any).concepts
        : [];
    const parsed = z.array(ocConceptSchema).safeParse(source);
    if (!parsed.success) {
      throw new Error(`Invalid concepts payload: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  if (operation === "profile") {
    const parsed = ocProfileSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Invalid profile payload: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  // reroll — partial profile
  const parsed = ocProfilePartialSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Invalid reroll payload: ${parsed.error.message}`);
  }
  return parsed.data;
}

/**
 * Merge a reroll response into an existing profile. Locked fields are never
 * overwritten, even if the model returned a value for them.
 */
export function mergeOcReroll(
  profile: OcProfile,
  changes: Partial<OcProfile>,
  lockedFields: string[]
): OcProfile {
  const locked = new Set(lockedFields);
  const merged: OcProfile = {
    ...profile,
    identity: { ...profile.identity },
  };

  for (const [key, value] of Object.entries(changes)) {
    if (locked.has(key)) continue;
    if (key === "identity" && value && typeof value === "object") {
      merged.identity = { ...merged.identity, ...(value as OcProfile["identity"]) };
      continue;
    }
    (merged as Record<string, unknown>)[key] = value;
  }

  return merged;
}
