"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BibleCharacter } from "@/models/story-bible";

type BibleData = {
  uuid: string;
  name: string;
  characters: BibleCharacter[];
  world_lore: string;
  style_note: string;
};

interface StoryBiblePanelProps {
  storyUuid: string;
  onBibleChange?: (hasBible: boolean) => void;
}

function getCopy(locale: string) {
  if (locale.startsWith("zh")) {
    return {
      title: "Story Bible",
      subtitle: "角色档案 & 世界观",
      characters: "角色",
      addCharacter: "+ 添加角色",
      charName: "姓名",
      charRole: "角色定位",
      charPersonality: "性格特征",
      charBackstory: "背景故事",
      charRelationships: "人物关系",
      worldLore: "世界设定",
      worldLorePlaceholder: "描述故事发生的世界、时代背景、重要地点…",
      styleNote: "风格备注",
      styleNotePlaceholder: "对 AI 续写风格的额外要求…",
      save: "保存",
      saving: "保存中…",
      saved: "已保存",
      loadFailed: "加载失败",
      saveFailed: "保存失败",
      deleteChar: "删除",
      noStory: "请先将内容保存为故事，再使用 Story Bible。",
      activeHint: "已激活，AI 续写将参考角色与世界观。",
      inactiveHint: "保存后将在 AI 续写中自动生效。",
      charCount: "个角色",
      hasLore: "有世界观",
      hasStyle: "有风格备注",
    };
  }
  return {
    title: "Story Bible",
    subtitle: "Character profiles & world lore",
    characters: "Characters",
    addCharacter: "+ Add Character",
    charName: "Name",
    charRole: "Role",
    charPersonality: "Personality",
    charBackstory: "Backstory",
    charRelationships: "Relationships",
    worldLore: "World Lore",
    worldLorePlaceholder: "Describe the world, era, key locations…",
    styleNote: "Style Note",
    styleNotePlaceholder: "Extra style instructions for AI continuations…",
    save: "Save",
    saving: "Saving…",
    saved: "Saved",
    loadFailed: "Failed to load bible",
    saveFailed: "Failed to save bible",
    deleteChar: "Remove",
    noStory: "Please save your draft as a story first, then use Story Bible.",
    activeHint: "Active. AI continuation will reference characters & lore.",
    inactiveHint: "Save to activate in AI continuation.",
    charCount: "characters",
    hasLore: "Lore",
    hasStyle: "Style",
  };
}

const CACHE_PREFIX = "ai-write:bible:";

const emptyCharacter: BibleCharacter = {
  name: "",
  role: "",
  personality: "",
  backstory: "",
  relationships: "",
};

const defaultBible: BibleData = {
  uuid: "",
  name: "Default",
  characters: [],
  world_lore: "",
  style_note: "",
};

function cacheKey(storyUuid: string) {
  return CACHE_PREFIX + storyUuid;
}

function loadCache(storyUuid: string): BibleData | null {
  try {
    const raw = localStorage.getItem(cacheKey(storyUuid));
    if (!raw) return null;
    return JSON.parse(raw) as BibleData;
  } catch {
    return null;
  }
}

function saveCache(storyUuid: string, data: BibleData) {
  try {
    localStorage.setItem(cacheKey(storyUuid), JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export default function StoryBiblePanel({ storyUuid, onBibleChange }: StoryBiblePanelProps) {
  const locale = useLocale();
  const copy = getCopy(locale);

  const [bible, setBible] = useState<BibleData>({ ...defaultBible });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const isActive = !!(bible.uuid && (bible.characters.length > 0 || bible.world_lore || bible.style_note));

  useEffect(() => {
    onBibleChange?.(isActive);
  }, [isActive, onBibleChange]);

  useEffect(() => {
    if (loaded || !storyUuid) {
      if (!storyUuid) setIsLoading(false);
      return;
    }
    setLoaded(true);

    // 1. Show cached data immediately
    const cached = loadCache(storyUuid);
    if (cached?.uuid) {
      setBible(cached);
      setIsLoading(false);
    }

    // 2. Fetch fresh data from API
    fetch(`/api/story-bible?story=${storyUuid}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.code !== 0 || !json.data?.uuid) {
          // No server data — clear stale cache if it existed
          if (cached?.uuid) {
            setBible({ ...defaultBible });
            localStorage.removeItem(cacheKey(storyUuid));
          }
          return;
        }
        const b = json.data;
        const fresh: BibleData = {
          uuid: b.uuid,
          name: "Default",
          characters: b.characters || [],
          world_lore: b.world_lore || "",
          style_note: b.style_note || "",
        };
        setBible(fresh);
        saveCache(storyUuid, fresh);
      })
      .catch(() => {
        // API failed — keep cached data if we have it, otherwise show error
        if (!cached?.uuid) toast.error(copy.loadFailed);
      })
      .finally(() => setIsLoading(false));
  }, [loaded, storyUuid, copy.loadFailed]);

  const handleSave = useCallback(async () => {
    if (!storyUuid) {
      toast.error(copy.noStory);
      return;
    }
    setIsSaving(true);
    try {
      if (bible.uuid) {
        const resp = await fetch(`/api/story-bible/${bible.uuid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characters: bible.characters,
            world_lore: bible.world_lore,
            style_note: bible.style_note,
          }),
        });
        const json = await resp.json();
        if (json.code !== 0) throw new Error(json.message);
      } else {
        const resp = await fetch("/api/story-bible", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            story_uuid: storyUuid,
            characters: bible.characters,
            world_lore: bible.world_lore,
            style_note: bible.style_note,
          }),
        });
        const json = await resp.json();
        if (json.code !== 0 || !json.data?.uuid) throw new Error(json.message);
        setBible((prev) => {
          const updated = { ...prev, uuid: json.data.uuid };
          saveCache(storyUuid, updated);
          return updated;
        });
        toast.success(copy.saved);
        return;
      }
      saveCache(storyUuid, bible);
      toast.success(copy.saved);
    } catch {
      toast.error(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }, [bible, copy, storyUuid]);

  const updateCharacter = useCallback(
    (index: number, field: keyof BibleCharacter, value: string) => {
      setBible((prev) => {
        const chars = [...prev.characters];
        chars[index] = { ...chars[index], [field]: value };
        return { ...prev, characters: chars };
      });
    },
    []
  );

  const addCharacter = useCallback(() => {
    setBible((prev) => ({ ...prev, characters: [...prev.characters, { ...emptyCharacter }] }));
  }, []);

  const removeCharacter = useCallback((index: number) => {
    setBible((prev) => {
      const chars = prev.characters.filter((_, i) => i !== index);
      return { ...prev, characters: chars };
    });
  }, []);

  return (
    <div className="flex h-full flex-col divide-y divide-border/40 overflow-hidden">
      {/* Status bar */}
      {storyUuid && (
        <div className="flex items-center gap-1.5 px-4 py-2">
          {isActive ? (
            <>
              <span className="size-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] text-green-700 dark:text-green-400">{copy.activeHint}</span>
            </>
          ) : (
            <>
              <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              <span className="text-[11px] text-muted-foreground">{copy.inactiveHint}</span>
            </>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-4 py-8">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-blue-500" />
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:0.2s]" />
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:0.4s]" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="flex-1 space-y-5 overflow-auto px-3 py-3 sm:px-4 sm:py-4">
          {/* Characters */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {copy.characters}
            </h3>

            {bible.characters.map((char, i) => (
              <div
                key={i}
                className="mb-3 rounded-xl border border-border/50 bg-background p-2.5 sm:p-3"
              >
                <div className="flex items-start justify-between">
                  <Input
                    value={char.name}
                    onChange={(e) => updateCharacter(i, "name", e.target.value)}
                    placeholder={copy.charName}
                    className="mb-2 h-7 border-none bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeCharacter(i)}
                    className="ml-1 shrink-0 text-[10px] text-muted-foreground/60 hover:text-destructive"
                  >
                    {copy.deleteChar}
                  </button>
                </div>
                <Input
                  value={char.role}
                  onChange={(e) => updateCharacter(i, "role", e.target.value)}
                  placeholder={copy.charRole}
                  className="mb-1.5 h-6 border-none bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                />
                <textarea
                  value={char.personality}
                  onChange={(e) => updateCharacter(i, "personality", e.target.value)}
                  placeholder={copy.charPersonality}
                  rows={2}
                  className="mb-1.5 w-full resize-none bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                />
                <textarea
                  value={char.backstory}
                  onChange={(e) => updateCharacter(i, "backstory", e.target.value)}
                  placeholder={copy.charBackstory}
                  rows={2}
                  className="mb-1.5 w-full resize-none bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                />
                <textarea
                  value={char.relationships}
                  onChange={(e) => updateCharacter(i, "relationships", e.target.value)}
                  placeholder={copy.charRelationships}
                  rows={1}
                  className="w-full resize-none bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addCharacter}
              className="w-full rounded-lg border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition hover:border-blue-400/60 hover:bg-blue-50/50 hover:text-blue-600 dark:hover:bg-blue-900/10"
            >
              {copy.addCharacter}
            </button>
          </div>

          {/* World Lore */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {copy.worldLore}
            </h3>
            <textarea
              value={bible.world_lore}
              onChange={(e) =>
                setBible((prev) => ({ ...prev, world_lore: e.target.value }))
              }
              placeholder={copy.worldLorePlaceholder}
              rows={4}
              className="w-full resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-blue-400/60"
            />
          </div>

          {/* Style Note */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {copy.styleNote}
            </h3>
            <textarea
              value={bible.style_note}
              onChange={(e) =>
                setBible((prev) => ({ ...prev, style_note: e.target.value }))
              }
              placeholder={copy.styleNotePlaceholder}
              rows={3}
              className="w-full resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-blue-400/60"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      {!isLoading && (
        <div className="space-y-2 px-4 py-3">
          {isActive && (
            <div className="flex flex-wrap items-center gap-1.5">
              {bible.characters.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {bible.characters.length} {copy.charCount}
                </span>
              )}
              {bible.world_lore && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {copy.hasLore}
                </span>
              )}
              {bible.style_note && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {copy.hasStyle}
                </span>
              )}
            </div>
          )}
          <Button
            size="sm"
            className={cn(
              "h-8 w-full rounded-xl text-xs text-white",
              isActive
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            )}
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? copy.saving : isActive ? copy.saved : copy.save}
          </Button>
        </div>
      )}
    </div>
  );
}
