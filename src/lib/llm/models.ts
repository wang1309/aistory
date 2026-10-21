import { getAiProvider } from "./config";
import type { AiProvider, ModelTier } from "./types";

export const MODEL_TIERS: ModelTier[] = ["fast", "standard", "creative"];

/**
 * Provider-specific defaults for the three UI tiers.
 *
 * APIMart prices (USD per 1M tokens, effective rates from
 * https://api.apimart.ai/api/pricing/model):
 * - gemini-2.5-flash       0.24 / 2.00
 * - gemini-2.5-flash-lite  0.08 / 0.32
 * - gemini-3-flash-preview 0.40 / 2.40
 */
export const DEFAULT_MODEL_TIERS: Record<
  AiProvider,
  Record<ModelTier, string>
> = {
  grsai: {
    fast: "gemini-2.5-flash",
    standard: "gemini-3.1-flash-lite",
    creative: "gemini-3-flash",
  },
  apimart: {
    fast: "gemini-2.5-flash",
    standard: "gemini-2.5-flash-lite",
    creative: "gemini-3-flash-preview",
  },
};

const MODEL_ENV_KEYS: Record<ModelTier, string> = {
  fast: "AI_MODEL_FAST",
  standard: "AI_MODEL_STANDARD",
  creative: "AI_MODEL_CREATIVE",
};

/**
 * Provider-scoped overrides. These win over the generic AI_MODEL_* keys and
 * let an APIMart-only model (e.g. gpt-5-nano) coexist with a GRSAI fallback.
 */
const PROVIDER_MODEL_ENV_KEYS: Record<
  AiProvider,
  Partial<Record<ModelTier, string>>
> = {
  grsai: {},
  apimart: {
    fast: "APIMART_MODEL_FAST",
    standard: "APIMART_MODEL_STANDARD",
    creative: "APIMART_MODEL_CREATIVE",
  },
};

function readModelOverride(tier: ModelTier, provider: AiProvider): string {
  const scopedKey = PROVIDER_MODEL_ENV_KEYS[provider][tier];
  const scoped = scopedKey ? (process.env[scopedKey] || "").trim() : "";

  if (scoped) {
    return scoped;
  }

  return (process.env[MODEL_ENV_KEYS[tier]] || "").trim();
}

/**
 * GRSAI model IDs that need a different APIMart counterpart. This is a safety
 * net for any call site that still passes a literal model ID.
 */
const MODEL_ID_ALIASES: Record<AiProvider, Record<string, string>> = {
  grsai: {},
  apimart: {
    "gemini-3.1-flash-lite": "gemini-2.5-flash-lite",
    "gemini-3-flash": "gemini-3-flash-preview",
    "agnes-2.5-flash": "gemini-2.5-flash-lite",
  },
};

export function isModelTier(value: string): value is ModelTier {
  return (MODEL_TIERS as string[]).includes(value);
}

export function translateModelId(
  model: string,
  provider: AiProvider = getAiProvider()
): string {
  if (provider !== "apimart") {
    return model;
  }

  // An explicit model override must win even when the chosen ID happens to
  // match a legacy GRSAI alias.
  const overrides = [
    ...Object.values(MODEL_ENV_KEYS),
    ...Object.values(PROVIDER_MODEL_ENV_KEYS[provider]),
  ]
    .map((key) => (process.env[key] || "").trim())
    .filter(Boolean);

  if (overrides.includes(model)) {
    return model;
  }

  return MODEL_ID_ALIASES[provider][model] || model;
}

/**
 * Resolve a UI tier ("fast" / "standard" / "creative") or a literal model ID
 * into the model ID for the active provider.
 */
export function resolveModelTier(
  tierOrModel?: string | null,
  provider: AiProvider = getAiProvider()
): string {
  const value = (tierOrModel || "standard").trim();

  if (!isModelTier(value)) {
    return translateModelId(value, provider);
  }

  const override = readModelOverride(value, provider);
  return override || DEFAULT_MODEL_TIERS[provider][value];
}

export function getModelTierMap(
  provider: AiProvider = getAiProvider()
): Record<ModelTier, string> {
  return {
    fast: resolveModelTier("fast", provider),
    standard: resolveModelTier("standard", provider),
    creative: resolveModelTier("creative", provider),
  };
}

/**
 * Reverse-lookup the UI tier from an already-resolved model ID. Routes pass
 * literal IDs, so the wrapper uses this to apply tier-specific reasoning
 * policy without changing every call site.
 */
export function inferModelTier(
  model: string,
  provider: AiProvider = getAiProvider()
): ModelTier | null {
  const tiers = getModelTierMap(provider);
  return MODEL_TIERS.find((tier) => tiers[tier] === model) ?? null;
}

/**
 * Models that accept `reasoning_effort` and can burn their whole output budget
 * on hidden reasoning. Keep this list narrow so we never send the parameter to
 * providers/models that reject it.
 */
export function isReasoningModel(
  model: string,
  provider: AiProvider = getAiProvider()
): boolean {
  return provider === "apimart" && /^gpt-5/i.test(model);
}

const REASONING_EFFORT_ENV_KEYS: Record<ModelTier, string> = {
  fast: "APIMART_REASONING_EFFORT_FAST",
  standard: "APIMART_REASONING_EFFORT_STANDARD",
  creative: "APIMART_REASONING_EFFORT_CREATIVE",
};

/**
 * Tier-aware reasoning effort.
 *
 * - fast: defaults to "low" (keeps thinking, but leaves room for visible text)
 * - standard / creative: unset by default, so the model keeps its own behavior
 * - `APIMART_REASONING_EFFORT` is a generic fallback for all tiers
 * - "off" disables the injection
 */
export function resolveReasoningEffort(
  tier: ModelTier | null,
  provider: AiProvider = getAiProvider()
): string | null {
  if (provider !== "apimart" || !tier) {
    return null;
  }

  const scoped = (process.env[REASONING_EFFORT_ENV_KEYS[tier]] || "").trim();
  const generic = (process.env.APIMART_REASONING_EFFORT || "").trim();
  const value = scoped || generic;

  if (tier === "fast") {
    if (value === "off") {
      return null;
    }
    return value || "low";
  }

  if (!value || value === "off") {
    return null;
  }

  return value;
}

/**
 * Fast-tier reasoning models need enough budget for both reasoning and visible
 * content. Only applied when a route explicitly sets a lower `max_tokens`.
 * `0` / "off" disables the floor.
 */
export function resolveFastMinMaxTokens(): number {
  const raw = (process.env.APIMART_REASONING_FAST_MIN_MAX_TOKENS || "4096").trim();

  if (!raw || raw === "off") {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
