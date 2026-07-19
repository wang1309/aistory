import { ocProfileSchema, type OcProfile } from "@/lib/oc-schema";

export const OC_HANDOFF_KEY = "oc-generator:handoff:v1";

export type OcHandoffPayload = {
  version: 1;
  source: "oc-generator";
  profile: OcProfile;
  visualPrompt: string;
};

function safeRead(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.warn("oc-handoff: failed to remove handoff key", error);
  }
}

/**
 * Validate a parsed payload against the handoff contract. Returns null for any
 * shape that does not satisfy the version, source, or nested profile schema.
 */
function validatePayload(value: unknown): OcHandoffPayload | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return null;
  if (v.source !== "oc-generator") return null;
  const profileResult = ocProfileSchema.safeParse(v.profile);
  if (!profileResult.success) return null;
  if (typeof v.visualPrompt !== "string") return null;
  return {
    version: 1,
    source: "oc-generator",
    profile: profileResult.data,
    visualPrompt: v.visualPrompt,
  };
}

export function writeOcHandoff(storage: Storage, payload: OcHandoffPayload): void {
  try {
    storage.setItem(OC_HANDOFF_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("oc-handoff: failed to write handoff payload", error);
  }
}

export function readOcHandoff(storage: Storage): OcHandoffPayload | null {
  const raw = safeRead(storage, OC_HANDOFF_KEY);
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return validatePayload(parsed);
}

/**
 * Read and remove the handoff payload in one step. The payload is removed even
 * when validation fails so a poisoned entry never blocks downstream tools.
 */
export function consumeOcHandoff(storage: Storage): OcHandoffPayload | null {
  const payload = readOcHandoff(storage);
  safeRemove(storage, OC_HANDOFF_KEY);
  return payload;
}

/**
 * Build a concise, plain-text prompt prefill for a downstream generator. Never
 * emits raw JSON — downstream inputs are free-text prompts, not structured
 * payloads.
 */
export function buildOcPromptPrefill(payload: OcHandoffPayload): string {
  const { profile } = payload;
  const id = profile.identity;
  const lines: string[] = [];

  lines.push(
    `Original character: ${id.name}${id.pronouns ? ` (${id.pronouns})` : ""}.`
  );
  const identityBits = [
    id.age ? `age ${id.age}` : null,
    id.role ? `role: ${id.role}` : null,
    id.species ? `species: ${id.species}` : null,
    id.aliases?.length ? `also called ${id.aliases.join(", ")}` : null,
  ].filter(Boolean);
  if (identityBits.length) {
    lines.push(identityBits.join("; ") + ".");
  }

  if (profile.appearance) {
    lines.push(`Appearance: ${profile.appearance}.`);
  }
  if (profile.personality) {
    lines.push(`Personality: ${profile.personality}.`);
  }
  if (profile.desire) {
    lines.push(`Desire: ${profile.desire}.`);
  }
  if (profile.flaw) {
    lines.push(`Flaw: ${profile.flaw}.`);
  }
  if (profile.secret) {
    lines.push(`Secret: ${profile.secret}.`);
  }
  if (profile.relationships?.length) {
    lines.push(`Key relationships: ${profile.relationships.join("; ")}.`);
  }
  if (profile.conflict) {
    lines.push(`Core conflict: ${profile.conflict}.`);
  }
  if (profile.storyHooks?.length) {
    lines.push(`Story hooks: ${profile.storyHooks.join("; ")}.`);
  }
  if (payload.visualPrompt) {
    lines.push(`Visual reference: ${payload.visualPrompt}.`);
  }

  lines.push(
    "Continue from this original character. Keep their voice, traits, and conflict consistent."
  );

  return lines.join("\n");
}
