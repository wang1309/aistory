import {
  ocProfileSchema,
  type OcConcept,
  type OcMode,
  type OcProfile,
} from "@/lib/oc-schema";

export const OC_DRAFT_KEY = "oc-generator:draft:v1";
export const OC_CHARACTERS_KEY = "oc-generator:characters:v1";

export const OC_CHARACTER_LIMIT = 20;
export const OC_VERSION_LIMIT = 10;

export type OcDraft = {
  mode: OcMode;
  world: string;
  role: string;
  constraints: string;
  view?: string;
  concepts?: OcConcept[];
  selectedConceptId?: string;
  profile?: OcProfile;
  lockedFields?: string[];
};

export type StoredOcVersion = {
  id: string;
  createdAt: number;
  profile: OcProfile;
  note?: string;
};

export type StoredOcCharacter = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  world: string;
  role: string;
  currentVersionId: string;
  versions: StoredOcVersion[];
};

function safeWindowStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(storage: Storage | null, key: string): T | null {
  if (!storage) return null;
  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // QuotaExceededError and private-mode failures are recoverable: drafts and
    // history are best-effort local conveniences, never the source of truth.
    console.warn(`oc-storage: failed to write ${key}`, error);
  }
}

export function readOcDraft(storage?: Storage): OcDraft | null {
  const target = storage ?? safeWindowStorage();
  return readJson<OcDraft>(target, OC_DRAFT_KEY);
}

export function writeOcDraft(storage: Storage, draft: OcDraft): void {
  writeJson(storage, OC_DRAFT_KEY, draft);
}

export function readOcCharacters(storage?: Storage): StoredOcCharacter[] {
  const target = storage ?? safeWindowStorage();
  const parsed = readJson<unknown>(target, OC_CHARACTERS_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isStoredCharacter);
}

function isStoredCharacter(value: unknown): value is StoredOcCharacter {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    Array.isArray(v.versions) &&
    typeof v.updatedAt === "number"
  );
}

/**
 * Sort newest-first by updatedAt, then clamp to the configured character limit.
 */
export function clampOcCharacters(
  characters: StoredOcCharacter[]
): StoredOcCharacter[] {
  return [...characters]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, OC_CHARACTER_LIMIT);
}

/**
 * Sort newest-first by createdAt, then clamp to the configured version limit.
 */
export function clampOcVersions(
  versions: StoredOcVersion[]
): StoredOcVersion[] {
  return [...versions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, OC_VERSION_LIMIT);
}

export function saveOcCharacter(
  storage: Storage,
  character: StoredOcCharacter
): StoredOcCharacter[] {
  const existing = readOcCharacters(storage);
  const without = existing.filter((entry) => entry.id !== character.id);
  const next = clampOcCharacters([character, ...without]);
  writeJson(storage, OC_CHARACTERS_KEY, next);
  return next;
}

export function deleteOcCharacter(
  storage: Storage,
  id: string
): StoredOcCharacter[] {
  const next = readOcCharacters(storage).filter((entry) => entry.id !== id);
  writeJson(storage, OC_CHARACTERS_KEY, next);
  return next;
}

export function clearOcCharacters(storage: Storage): void {
  try {
    storage.removeItem(OC_CHARACTERS_KEY);
  } catch (error) {
    console.warn("oc-storage: failed to clear characters", error);
  }
}

function resolveProfile(
  character: StoredOcCharacter,
  versionId?: string
): { profile: OcProfile | null; version: StoredOcVersion | null } {
  const versions = character.versions ?? [];
  if (versions.length === 0) return { profile: null, version: null };
  const sorted = clampOcVersions(versions);
  const version = versionId
    ? sorted.find((entry) => entry.id === versionId) ?? sorted[0]
    : sorted[0];
  return { profile: version?.profile ?? null, version: version ?? null };
}

const MARKDOWN_LABELS = {
  identity: "Identity",
  name: "Name",
  aliases: "Aliases",
  age: "Age",
  pronouns: "Pronouns",
  role: "Role",
  species: "Species",
  appearance: "Appearance",
  personality: "Personality",
  desire: "Desire",
  flaw: "Flaw",
  secret: "Secret",
  relationships: "Relationships",
  conflict: "Conflict",
  storyHooks: "Story Hooks",
  visualPrompt: "Visual Prompt",
} as const;

export function ocProfileToMarkdown(
  character: StoredOcCharacter,
  versionId?: string
): string {
  const { profile, version } = resolveProfile(character, versionId);
  const lines: string[] = [];

  lines.push(`# ${character.name || profile?.identity.name || "Original Character"}`);
  if (version?.note) {
    lines.push(`> ${version.note}`);
  }
  lines.push("");

  if (!profile) {
    lines.push("_No profile data stored for this version._");
    return lines.join("\n");
  }

  const id = profile.identity;
  lines.push(`## ${MARKDOWN_LABELS.identity}`);
  lines.push(`- **${MARKDOWN_LABELS.name}:** ${id.name}`);
  if (id.aliases?.length) {
    lines.push(`- **${MARKDOWN_LABELS.aliases}:** ${id.aliases.join(", ")}`);
  }
  lines.push(`- **${MARKDOWN_LABELS.age}:** ${id.age}`);
  lines.push(`- **${MARKDOWN_LABELS.pronouns}:** ${id.pronouns}`);
  lines.push(`- **${MARKDOWN_LABELS.role}:** ${id.role}`);
  lines.push(`- **${MARKDOWN_LABELS.species}:** ${id.species}`);
  lines.push("");

  lines.push(`## ${MARKDOWN_LABELS.appearance}`);
  lines.push(profile.appearance);
  lines.push("");

  lines.push(`## ${MARKDOWN_LABELS.personality}`);
  lines.push(profile.personality);
  lines.push("");

  lines.push(`## ${MARKDOWN_LABELS.desire}`);
  lines.push(profile.desire);
  lines.push("");

  lines.push(`## ${MARKDOWN_LABELS.flaw}`);
  lines.push(profile.flaw);
  lines.push("");

  lines.push(`## ${MARKDOWN_LABELS.secret}`);
  lines.push(profile.secret);
  lines.push("");

  if (profile.relationships?.length) {
    lines.push(`## ${MARKDOWN_LABELS.relationships}`);
    for (const relation of profile.relationships) {
      lines.push(`- ${relation}`);
    }
    lines.push("");
  }

  lines.push(`## ${MARKDOWN_LABELS.conflict}`);
  lines.push(profile.conflict);
  lines.push("");

  if (profile.storyHooks?.length) {
    lines.push(`## ${MARKDOWN_LABELS.storyHooks}`);
    for (const hook of profile.storyHooks) {
      lines.push(`- ${hook}`);
    }
    lines.push("");
  }

  lines.push(`## ${MARKDOWN_LABELS.visualPrompt}`);
  lines.push(profile.visualPrompt);

  return lines.join("\n");
}

export function ocProfileToJson(
  character: StoredOcCharacter,
  versionId?: string
): string {
  const { profile } = resolveProfile(character, versionId);
  // Validate before export so a corrupt stored profile never ships as JSON.
  const safe =
    profile && ocProfileSchema.safeParse(profile).success ? profile : null;
  if (!safe) {
    return JSON.stringify(
      {
        name: character.name,
        world: character.world,
        role: character.role,
        profile: null,
      },
      null,
      2
    );
  }
  // Export the profile shape directly so it can be re-imported or pasted into
  // another tool, annotated with the character's origin metadata.
  return JSON.stringify(
    {
      ...safe,
      _meta: {
        name: character.name,
        world: character.world,
        role: character.role,
      },
    },
    null,
    2
  );
}
