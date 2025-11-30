"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    <div className="space-y-3 rounded-lg border bg-background p-4 md:p-5">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("my_stories.tags_label")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("my_stories.tags_description")}
          </p>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] text-muted-foreground"
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
        />
        <Button
          type="button"
          size="sm"
          className="sm:w-[120px]"
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saving ? t("my_stories.tags_saving") : t("my_stories.tags_save_button")}
        </Button>
      </div>
    </div>
  );
}
