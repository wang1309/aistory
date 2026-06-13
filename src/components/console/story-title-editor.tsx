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
import { RiPencilLine } from "react-icons/ri";

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
  const isUntitled = !currentTitle.trim();

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
    <div className="flex items-start gap-3">
      <h1
        className={`font-display text-2xl font-bold tracking-tight break-words md:text-3xl ${
          isUntitled ? "text-muted-foreground/40 italic" : ""
        }`}
      >
        {displayTitle}
      </h1>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted hover:text-muted-foreground">
            <RiPencilLine className="size-3.5" />
          </button>
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
