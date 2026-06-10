const MODEL_ALIASES: Record<string, string> = {
  generic: "agnes-2.0-flash",
};

export function resolveModelAlias(alias: string | null | undefined): string | null {
  if (!alias) return null;
  return MODEL_ALIASES[alias] ?? alias;
}
