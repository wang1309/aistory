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
          variant="outline"
          size="sm"
          className="rounded-full h-8 px-3 text-xs font-medium border-indigo-200/70 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/70"
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px] max-h-[80vh] p-0 overflow-hidden border-0 bg-background/90 backdrop-blur-2xl shadow-2xl rounded-3xl">
        <DialogHeader className="px-6 pt-5 pb-3 space-y-2 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500/80 dark:text-indigo-300/80">
            {label}
          </p>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground/80 whitespace-pre-line">
            {meta}
          </p>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4 max-h-[calc(80vh-120px)] overflow-y-auto text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
