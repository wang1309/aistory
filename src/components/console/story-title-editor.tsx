"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface StoryTitleEditorProps {
  uuid: string;
  initialTitle: string;
  untitledLabel: string;
}

export default function StoryTitleEditor({
  uuid,
  initialTitle,
  untitledLabel,
}: StoryTitleEditorProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(initialTitle || "");
  const [value, setValue] = useState(initialTitle || "");
  const [isPending, startTransition] = useTransition();

  const displayTitle = currentTitle.trim() || untitledLabel;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setValue(currentTitle || "");
    }
  };

  const handleSave = () => {
    const newTitle = value.trim();
    if (newTitle === currentTitle.trim()) {
      setOpen(false);
      return;
    }

    startTransition(async () => {
      try {
        const resp = await fetch(`/api/stories/${uuid}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: newTitle }),
        });

        if (!resp.ok) {
          throw new Error("request failed with status: " + resp.status);
        }

        const { code, message } = await resp.json();
        if (code !== 0) {
          toast.error(message || t("common.error"));
          return;
        }

        setCurrentTitle(newTitle);
        setOpen(false);
        toast.success(t("my_stories.edit_title_success"));
      } catch (e) {
        console.log("update story title failed", e);
        toast.error(t("common.error"));
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-semibold tracking-tight break-words">
        {displayTitle}
      </h1>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {t("my_stories.edit_title")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("my_stories.edit_title")}</DialogTitle>
            <DialogDescription>
              {t("my_stories.edit_title_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-foreground">
              {t("my_stories.edit_title_label")}
            </label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={untitledLabel}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {t("my_stories.edit_title_cancel")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
            >
              {t("my_stories.edit_title_save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
