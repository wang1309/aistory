"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StoryPreviewButtonProps {
  title: string;
  content: string;
  meta: string;
  label: string;
}

export default function StoryPreviewButton({
  title,
  content,
  meta,
  label,
}: StoryPreviewButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 rounded-full border border-border/40 bg-card px-2.5 text-[11px] font-medium text-muted-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/70 hover:bg-muted/40 hover:text-foreground active:scale-[0.97]"
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-[1.5rem] border-border/40 bg-card p-0 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.18)] sm:max-w-[720px] max-h-[80vh]">
        <div className="rounded-t-[calc(1.5rem-1px)] border-b border-border/30 bg-muted/30 px-6 pt-5 pb-4">
          <DialogHeader className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
              {label}
            </p>
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </DialogTitle>
            {meta && (
              <p className="text-[11px] font-medium text-muted-foreground/70">
                {meta}
              </p>
            )}
          </DialogHeader>
        </div>
        <div className="max-h-[calc(80vh-140px)] overflow-y-auto whitespace-pre-line px-6 py-5 text-sm leading-relaxed text-muted-foreground/90">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
