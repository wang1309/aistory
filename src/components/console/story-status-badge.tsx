"use client";

import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted/60 text-muted-foreground",
  },
  saved: {
    label: "Saved",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  published: {
    label: "Published",
    className: "bg-primary/10 text-primary",
  },
};

export default function StoryStatusBadge({ status }: { status?: string | null }) {
  const config = STATUS_CONFIG[status || "draft"] || STATUS_CONFIG.draft;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        config.className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "published"
            ? "bg-primary"
            : status === "saved"
            ? "bg-emerald-500"
            : "bg-muted-foreground/40"
        )}
      />
      {config.label}
    </span>
  );
}
