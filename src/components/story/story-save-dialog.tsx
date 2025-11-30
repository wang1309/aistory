"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { useMemo } from "react";
import type { StoryStatus } from "@/models/story";
import { cn } from "@/lib/utils";

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
      title: locale === "zh" ? "保存你的杰作" : "Save Your Masterpiece",
      description:
        locale === "zh"
          ? "选择保存方式，记录你的创作灵感"
          : "Choose how you would like to save your creation",
      draft: locale === "zh" ? "保存为草稿" : "Save as Draft",
      draftDesc:
        locale === "zh"
          ? "还没写完？仅自己可见，随时继续编辑"
          : "Not finished? Keep it private and edit later",
      saved: locale === "zh" ? "保存到作品库" : "Save to Library",
      savedDesc:
        locale === "zh"
          ? "保存到个人作品库，随时回顾阅读"
          : "Save to your collection, ready to read anytime",
      published: locale === "zh" ? "发布到广场" : "Publish to Community",
      publishedDesc:
        locale === "zh"
          ? "公开分享你的故事，获得社区反馈与互动"
          : "Share with the community and get feedback",
      cancel: locale === "zh" ? "取消" : "Cancel",
    }),
    [locale]
  );

  const options = [
    {
      id: "draft",
      status: "draft" as StoryStatus,
      icon: "file-edit",
      color: "text-slate-500 dark:text-slate-400",
      bgColor: "bg-slate-100 dark:bg-slate-800/50",
      borderColor:
        "group-hover:border-slate-300 dark:group-hover:border-slate-600",
      title: labels.draft,
      desc: labels.draftDesc,
    },
    {
      id: "saved",
      status: "saved" as StoryStatus,
      icon: "bookmark",
      color: "text-indigo-500 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      borderColor:
        "group-hover:border-indigo-300 dark:group-hover:border-indigo-700",
      title: labels.saved,
      desc: labels.savedDesc,
    },
    {
      id: "published",
      status: "published" as StoryStatus,
      icon: "sparkles",
      color: "text-purple-500 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor:
        "group-hover:border-purple-300 dark:group-hover:border-purple-700",
      title: labels.published,
      desc: labels.publishedDesc,
      isPremium: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl bg-background/80 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 gap-0">
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">{labels.title}</DialogTitle>

        {/* Header with decorative background */}
        <div className="relative p-8 pb-6 text-center overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />
          {/* Decorative blobs */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Icon */}
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
              <div className="relative size-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                <Icon
                  name="save"
                  className="size-8 text-indigo-600 dark:text-indigo-400"
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
              {labels.title}
            </h2>
            <p className="text-muted-foreground text-sm max-w-[300px] leading-relaxed">
              {labels.description}
            </p>
          </div>
        </div>

        {/* Options List */}
        <div className="px-6 pb-6 space-y-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.status)}
              disabled={isSaving}
              className={cn(
                "w-full group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                "bg-card/50 hover:bg-card border-border/50",
                "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
                "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
                opt.borderColor,
                isSaving && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              {/* Icon Box */}
              <div
                className={cn(
                  "shrink-0 size-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  "group-hover:scale-110 group-hover:shadow-md",
                  opt.bgColor
                )}
              >
                <Icon
                  name={opt.icon}
                  className={cn("size-6 transition-colors", opt.color)}
                />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {opt.title}
                  </span>
                  {opt.isPremium && (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm animate-pulse">
                      HOT
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {opt.desc}
                </p>
              </div>

              {/* Arrow Indicator */}
              <div className="shrink-0 self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <Icon
                  name="chevron-right"
                  className="size-5 text-muted-foreground/50"
                />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className="rounded-full px-6 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            {labels.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
