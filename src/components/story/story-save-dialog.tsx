"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { useMemo } from "react";
import type { StoryStatus } from "@/models/story";

interface StorySaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (status: StoryStatus) => void;
  locale: string;
  isSaving?: boolean;
}

export default function StorySaveDialog({
  open,
  onOpenChange,
  onSelect,
  locale,
  isSaving,
}: StorySaveDialogProps) {
  const labels = useMemo(
    () => ({
      title:
        locale === "zh" ? "保存故事" : "Save your story",
      description:
        locale === "zh"
          ? "选择你想要的保存方式。"
          : "Choose how you'd like to save your story.",
      draft:
        locale === "zh" ? "保存为草稿" : "Save as draft",
      saved:
        locale === "zh" ? "保存" : "Save",
      published:
        locale === "zh" ? "发布" : "Publish",
      cancel:
        locale === "zh" ? "取消" : "Cancel",
    }),
    [locale]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            className="w-full justify-between rounded-2xl border-dashed"
            onClick={() => onSelect("draft")}
          >
            <span className="flex items-center gap-2">
              <Icon name="file-text" className="size-4" />
              <span>{labels.draft}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {locale === "zh" ? "稍后继续编辑" : "Keep editing later"}
            </span>
          </Button>

          <Button
            type="button"
            disabled={isSaving}
            className="w-full justify-between rounded-2xl"
            onClick={() => onSelect("saved")}
          >
            <span className="flex items-center gap-2">
              <Icon name="save" className="size-4" />
              <span>{labels.saved}</span>
            </span>
            <span className="text-xs text-indigo-100/80">
              {locale === "zh" ? "保存到创作空间" : "Keep in your library"}
            </span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={isSaving}
            className="w-full justify-between rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500"
            onClick={() => onSelect("published")}
          >
            <span className="flex items-center gap-2">
              <Icon name="megaphone" className="size-4" />
              <span>{labels.published}</span>
            </span>
            <span className="text-xs text-indigo-50/90">
              {locale === "zh" ? "为未来的社区发布做准备" : "Ready for future community features"}
            </span>
          </Button>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-full"
          >
            {labels.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
