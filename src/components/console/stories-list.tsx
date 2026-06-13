"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  RiBookOpenLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCalendarLine,
  RiFileTextLine,
} from "react-icons/ri";
import { Link } from "@/i18n/navigation";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StoryStatusBadge from "./story-status-badge";

interface StoryItem {
  uuid: string;
  title?: string | null;
  word_count?: number | null;
  status?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  prompt?: string | null;
  model_used?: string | null;
}

interface StoriesListProps {
  stories: StoryItem[];
  title: string;
  description: string;
  emptyMessage: string;
  untitledLabel: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    basePath: string;
  };
}

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getRelativeDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr) || "";
}

function extractPreview(content: string | null | undefined): string {
  if (!content) return "";
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      const texts = parsed
        .filter((b: any) => b.type === "paragraph" && b.children?.[0]?.text)
        .map((b: any) => b.children[0].text)
        .slice(0, 2);
      return texts.join(" ").slice(0, 120);
    }
    return content.slice(0, 120);
  } catch {
    return content.slice(0, 120);
  }
}

function StoryCard({
  story,
  index,
  untitledLabel,
}: {
  story: StoryItem;
  index: number;
  untitledLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100 + index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const preview = extractPreview(story.prompt);
  const title = story.title || untitledLabel;

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
    >
      <div className="group relative rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
        <div
          className={cn(
            "relative rounded-[1.125rem] border border-border/30 bg-card p-5 md:p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "group-hover:border-border/60 group-hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Main content - clickable */}
            <Link
              href={`/my-stories/${story.uuid}` as any}
              className="flex-1 min-w-0"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <StoryStatusBadge status={story.status} />
                {story.word_count != null && story.word_count > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground/50">
                    {story.word_count.toLocaleString()} words
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold tracking-tight line-clamp-1 group-hover:text-primary transition-colors duration-300">
                {title}
              </h4>
              {preview && (
                <p className="mt-1.5 text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed">
                  {preview}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground/40">
                <span className="inline-flex items-center gap-1">
                  <RiCalendarLine className="size-3" />
                  {getRelativeDate(story.created_at)}
                </span>
                {story.model_used && (
                  <span className="inline-flex items-center gap-1">
                    <RiFileTextLine className="size-3" />
                    {story.model_used}
                  </span>
                )}
              </div>
            </Link>

            {/* Actions */}
            <StoryActions story={story} untitledLabel={untitledLabel} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryActions({
  story,
  untitledLabel,
}: {
  story: StoryItem;
  untitledLabel: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [value, setValue] = useState(story.title || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSaving, startSaving] = useState(false);
  const [isDeleting, startDeleting] = useState(false);

  const refreshCurrentPage = () => {
    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.replace(url, { scroll: false });
  };

  const handleSave = () => {
    const newTitle = value.trim();
    startSaving(true);
    fetch(`/api/stories/${story.uuid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    })
      .then((resp) => {
        if (!resp.ok) throw new Error("failed");
        return resp.json();
      })
      .then(({ code, message }) => {
        if (code !== 0) {
          toast.error(message || t("common.error"));
          return;
        }
        toast.success(t("my_stories.edit_title_success"));
        setEditOpen(false);
        refreshCurrentPage();
      })
      .catch(() => toast.error(t("common.error")))
      .finally(() => startSaving(false));
  };

  const handleDelete = () => {
    startDeleting(true);
    fetch(`/api/stories/${story.uuid}`, { method: "DELETE" })
      .then((resp) => {
        if (!resp.ok) throw new Error("failed");
        return resp.json();
      })
      .then(({ code, message }) => {
        if (code !== 0) {
          toast.error(message || t("common.error"));
          return;
        }
        toast.success(t("my_stories.delete_story_success"));
        setDeleteOpen(false);
        refreshCurrentPage();
      })
      .catch(() => toast.error(t("common.error")))
      .finally(() => startDeleting(false));
  };

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground/50 transition-all duration-300 hover:bg-muted hover:text-foreground"
      >
        <RiMoreLine className="size-4" />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-border/50 bg-card p-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]">
            <button
              onClick={() => {
                setMenuOpen(false);
                setValue(story.title || "");
                setEditOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RiEditLine className="size-3.5" />
              {t("my_stories.edit_title")}
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <RiDeleteBinLine className="size-3.5" />
              {t("my_stories.delete_story")}
            </button>
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
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
              disabled={isSaving}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(false)}
              disabled={isSaving}
            >
              {t("my_stories.edit_title_cancel")}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {t("my_stories.edit_title_save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("my_stories.delete_story_confirm_title")}</DialogTitle>
            <DialogDescription>
              {t("my_stories.delete_story_confirm_description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              {t("my_stories.delete_story_confirm_cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {t("my_stories.delete_story_confirm_ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaginationBar({
  pagination,
}: {
  pagination: NonNullable<StoriesListProps["pagination"]>;
}) {
  const { page, totalPages, basePath } = pagination;

  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-xs text-muted-foreground/40">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={`${basePath}?page=${p}` as any}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-all duration-300",
              p === page
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {p}
          </Link>
        )
      )}
    </div>
  );
}

export default function StoriesList({
  stories,
  title,
  description,
  emptyMessage,
  untitledLabel,
  pagination,
}: StoriesListProps) {
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    setHeaderVisible(true);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className={cn(
          "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          headerVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        )}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <RiBookOpenLine className="size-4 text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
        </div>
        {description && (
          <p className="ml-11 text-sm text-muted-foreground/60">{description}</p>
        )}
      </div>

      {/* Story Cards */}
      {stories.length > 0 ? (
        <div className="flex flex-col gap-3">
          {stories.map((story, i) => (
            <StoryCard
              key={story.uuid}
              story={story}
              index={i}
              untitledLabel={untitledLabel}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02] transition-all duration-700 delay-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
            headerVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}
        >
          <div className="flex flex-col items-center justify-center rounded-[1.125rem] border border-dashed border-border/40 bg-card py-20">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
              <RiBookOpenLine className="size-6 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground/60">
              {emptyMessage}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && <PaginationBar pagination={pagination} />}
    </div>
  );
}
