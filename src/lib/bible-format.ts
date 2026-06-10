import type { BibleCharacter } from "@/models/story-bible";

export function formatBibleForPrompt(bible: {
  characters?: BibleCharacter[] | null;
  world_lore?: string | null;
  style_note?: string | null;
}): string {
  const parts: string[] = [];

  if (bible.characters?.length) {
    parts.push("== Characters ==");
    for (const c of bible.characters) {
      if (!c.name?.trim()) continue;
      parts.push(`- ${c.name}${c.role ? ` (${c.role})` : ""}`);
      if (c.personality?.trim()) parts.push(`  Personality: ${c.personality}`);
      if (c.backstory?.trim()) parts.push(`  Backstory: ${c.backstory}`);
      if (c.relationships?.trim())
        parts.push(`  Relationships: ${c.relationships}`);
    }
  }

  if (bible.world_lore?.trim()) {
    parts.push("== World Lore ==");
    parts.push(bible.world_lore.trim());
  }

  if (bible.style_note?.trim()) {
    parts.push("== Style Note ==");
    parts.push(bible.style_note.trim());
  }

  return parts.join("\n");
}
