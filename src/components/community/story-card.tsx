"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  RiCalendar2Line,
  RiFileTextLine,
  RiHashtag,
  RiHeart3Line,
} from "react-icons/ri";
import { Link } from "@/i18n/navigation";
import StoryLikeButton from "@/components/story/story-like-button";
import StoryPreviewButton from "@/components/community/story-preview-button";

export interface CommunityTag {
  id: string;
  name: string | null;
  slug: string;
}

export interface CommunityStory {
  uuid: string;
  title?: string | null;
  content: string;
  word_count?: number | null;
  created_at?: string | Date | null;
  tags: CommunityTag[];
}

interface StoryCardProps {
  story: CommunityStory;
  index: number;
  untitledLabel: string;
  previewLabel: string;
}

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "";
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
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return "Today";
  if (diffDays < 2) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

const TAG_TONES = [
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-indigo-500/15",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-emerald-500/15",
  "bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-amber-500/15",
  "bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-rose-500/15",
  "bg-sky-500/10 text-sky-600 dark:text-sky-300 ring-sky-500/15",
];

export default function StoryCard({
  story,
  index,
  untitledLabel,
  previewLabel,
}: StoryCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80 + index * 70);
    return () => clearTimeout(timer);
  }, [index]);

  const createdAt = formatDate(story.created_at);
  const relativeDate = getRelativeDate(story.created_at);
  const excerpt = story.content.slice(0, 140);
  const title = story.title || untitledLabel;
  const wordCount = story.word_count ?? 0;

  const previewMetaParts: string[] = [];
  if (wordCount > 0) previewMetaParts.push(`${wordCount} words`);
  if (createdAt) previewMetaParts.push(createdAt);
  const previewMeta = previewMetaParts.join(" • ");

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
    >
      <div className="group relative h-full rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/60 dark:bg-white/[0.02]">
        <div className="relative flex h-full flex-col rounded-[1.125rem] border border-border/30 bg-card p-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-border/60 group-hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.10)] md:p-6">
          <Link
            href={`/story/${story.uuid}` as any}
            className="flex flex-1 flex-col gap-4"
          >
            {/* Header: title + relative date */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight transition-colors duration-300 group-hover:text-primary">
                {title}
              </h3>
              {relativeDate && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                  <RiCalendar2Line className="size-2.5 opacity-70" />
                  {relativeDate}
                </span>
              )}
            </div>

            {/* Excerpt */}
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground/70">
              {excerpt}
              {excerpt.length >= 140 ? "…" : ""}
            </p>
          </Link>

          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {story.tags.slice(0, 3).map((tag, idx) => (
                <Link
                  key={tag.id}
                  href={`/community?tag=${encodeURIComponent(tag.slug)}` as any}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]",
                    TAG_TONES[idx % TAG_TONES.length]
                  )}
                >
                  <RiHashtag className="size-2.5 opacity-70" />
                  {tag.name}
                </Link>
              ))}
              {story.tags.length > 3 && (
                <span className="px-1 text-[10px] font-medium text-muted-foreground/50">
                  +{story.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/30 pt-4">
            <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground/50">
              {wordCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <RiFileTextLine className="size-3 opacity-70" />
                  {wordCount.toLocaleString()}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <RiHeart3Line className="size-3 opacity-70" />
                <span className="sr-only">likes</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <StoryPreviewButton
                title={title}
                content={story.content}
                meta={previewMeta}
                label={previewLabel}
              />
              <StoryLikeButton storyUuid={story.uuid} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
