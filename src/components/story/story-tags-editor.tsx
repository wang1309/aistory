"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RiPriceTag3Line } from "react-icons/ri";

interface StoryTagsEditorProps {
  storyUuid: string;
}

interface StoryTagItem {
  id: number;
  slug: string;
  name: string;
}

export default function StoryTagsEditor({ storyUuid }: StoryTagsEditorProps) {
  const t = useTranslations();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<StoryTagItem[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!storyUuid) {
      return;
    }

    let cancelled = false;

    async function fetchTags() {
      try {
        setLoading(true);

        const resp = await fetch(`/api/stories/${storyUuid}/tags`);
        const json = await resp.json().catch(() => null);

        if (!resp.ok || !json) {
          throw new Error("request failed");
        }

        if (json.code !== 0) {
          if (!cancelled) {
            toast.error(json.message || t("my_stories.tags_load_error"));
          }
          return;
        }

        const data = Array.isArray(json.data) ? json.data : [];

        if (!cancelled) {
          setTags(data);
          setInputValue(data.map((item: StoryTagItem) => item.name).join(", "));
        }
      } catch (e) {
        if (!cancelled) {
          console.log("load story tags failed", e);
          toast.error(t("my_stories.tags_load_error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTags();

    return () => {
      cancelled = true;
    };
  }, [storyUuid, t]);

  const parseInputToTagStrings = useCallback((value: string): string[] => {
    if (!value) {
      return [];
    }

    return value
      .split(/[，,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, []);

  const handleSave = useCallback(async () => {
    if (!storyUuid || saving) {
      return;
    }

    try {
      setSaving(true);

      const rawTags = parseInputToTagStrings(inputValue).slice(0, 10);

      const resp = await fetch(`/api/stories/${storyUuid}/tags`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: rawTags }),
      });

      const json = await resp.json().catch(() => null);

      if (!resp.ok || !json) {
        throw new Error("request failed");
      }

      if (json.code !== 0) {
        toast.error(json.message || t("my_stories.tags_save_error"));
        return;
      }

      const data = Array.isArray(json.data) ? json.data : [];
      setTags(data);
      setInputValue(data.map((item: StoryTagItem) => item.name).join(", "));

      toast.success(t("my_stories.tags_saved"));
    } catch (e) {
      console.log("save story tags failed", e);
      toast.error(t("my_stories.tags_save_error"));
    } finally {
      setSaving(false);
    }
  }, [storyUuid, saving, parseInputToTagStrings, inputValue, t]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <div className="rounded-[1.5rem] border border-border/30 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
      <div className="rounded-[1.25rem] bg-card p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/[0.08]">
            <RiPriceTag3Line className="size-3.5 text-primary/70" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground">
              {t("my_stories.tags_label")}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground/50">
              {t("my_stories.tags_description")}
            </p>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full bg-primary/[0.06] px-3 py-1 text-[11px] font-medium text-primary/70"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("my_stories.tags_placeholder")}
            disabled={loading || saving}
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            className="rounded-full px-5 sm:w-auto"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? t("my_stories.tags_saving") : t("my_stories.tags_save_button")}
          </Button>
        </div>
      </div>
    </div>
  );
}
