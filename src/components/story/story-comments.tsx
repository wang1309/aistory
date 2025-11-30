"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";

interface StoryCommentsProps {
  storyUuid: string;
}

interface StoryComment {
  id: number;
  story_uuid: string;
  user_uuid: string;
  content: string;
  parent_id: number | null;
  root_id: number | null;
  is_deleted: boolean;
  created_at: string | null;
}

interface CommentsResponse {
  items: StoryComment[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function StoryComments({ storyUuid }: StoryCommentsProps) {
  const t = useTranslations("community");
  const { user, setShowSignModal } = useAppContext();

  const [comments, setComments] = useState<StoryComment[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<StoryComment | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const hasMore = useMemo(() => {
    if (total === 0) return false;
    const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
    return page < totalPages;
  }, [page, pageSize, total]);

  const grouped = useMemo(() => {
    const roots: StoryComment[] = [];
    const childrenMap = new Map<number, StoryComment[]>();

    const sorted = [...comments].sort((a, b) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
      return at - bt;
    });

    for (const c of sorted) {
      if (!c.parent_id) {
        roots.push(c);
      } else if (c.root_id) {
        const list = childrenMap.get(c.root_id) || [];
        list.push(c);
        childrenMap.set(c.root_id, list);
      }
    }

    return { roots, childrenMap };
  }, [comments]);

  const loadPage = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (loading || loadingMore) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const url = new URL(
          `/api/stories/${storyUuid}/comments?page=${pageToLoad}&pageSize=${pageSize}`,
          window.location.origin
        );

        const resp = await fetch(url.toString(), {
          method: "GET",
        });

        const json = await resp.json().catch(() => null);

        if (!resp.ok || !json || json.code !== 0 || !json.data) {
          throw new Error(json?.message || "request failed");
        }

        const data = json.data as CommentsResponse;

        setTotal(data.pagination.total);
        setPage(data.pagination.page);

        if (append) {
          setComments((prev) => {
            const ids = new Set(prev.map((c) => c.id));
            const merged = [...prev];
            for (const c of data.items) {
              if (!ids.has(c.id)) {
                merged.push(c);
              }
            }
            return merged;
          });
        } else {
          setComments(data.items);
        }
      } catch (e) {
        console.log("load story comments failed", e);
        toast.error(t("comments_error"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loading, loadingMore, pageSize, storyUuid, t]
  );

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  const handleSubmit = useCallback(async () => {
    if (!user) {
      setShowSignModal(true);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed.length > 500) {
      toast.error(t("comments_too_long"));
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    try {
      const body: any = { content: trimmed };
      if (replyTo) {
        body.parentId = replyTo.id;
      }

      const resp = await fetch(`/api/stories/${storyUuid}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await resp.json().catch(() => null);

      if (!resp.ok || !json) {
        throw new Error("request failed");
      }

      if (json.code !== 0 || !json.data) {
        toast.error(json.message || t("comments_submit_error"));
        return;
      }

      const created: StoryComment = json.data as StoryComment;

      setComments((prev) => [...prev, created]);
      setContent("");
      setReplyTo(null);
    } catch (e) {
      console.log("submit comment failed", e);
      toast.error(t("comments_submit_error"));
    } finally {
      setSubmitting(false);
    }
  }, [user, setShowSignModal, content, submitting, replyTo, storyUuid, t]);

  const handleReply = useCallback((comment: StoryComment) => {
    if (!user) {
      setShowSignModal(true);
      return;
    }

    setReplyTo(comment);
  }, [user, setShowSignModal]);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleDelete = useCallback(
    async (comment: StoryComment) => {
      if (!user || user.uuid !== comment.user_uuid) {
        return;
      }

      const confirmed = window.confirm(t("comments_delete_confirm"));
      if (!confirmed) {
        return;
      }

      if (deletingId === comment.id) {
        return;
      }

      setDeletingId(comment.id);
      try {
        const resp = await fetch(
          `/api/stories/${storyUuid}/comments/${comment.id}`,
          {
            method: "DELETE",
          }
        );

        const json = await resp.json().catch(() => null);

        if (!resp.ok || !json) {
          throw new Error("request failed");
        }

        if (json.code !== 0) {
          toast.error(json.message || t("comments_delete_error"));
          return;
        }

        setComments((prev) =>
          prev.map((c) =>
            c.id === comment.id ? { ...c, is_deleted: true } : c
          )
        );
        toast.success(t("comments_delete_success"));
      } catch (e) {
        console.log("delete comment failed", e);
        toast.error(t("comments_delete_error"));
      } finally {
        setDeletingId(null);
      }
    },
    [user, deletingId, storyUuid, t]
  );

  return (
    <section className="mt-10 border-t pt-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Icon name="RiChat3Line" className="size-5" />
          {t("comments_title")}
        </h2>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {total}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {!user && (
          <div className="mb-1 text-xs text-muted-foreground flex items-center gap-2">
            <Icon name="RiInformationLine" className="size-4" />
            <span>{t("comments_login_hint")}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setShowSignModal(true)}
            >
              {t("comments_login_button")}
            </Button>
          </div>
        )}

        {replyTo && (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
              <Icon name="RiReplyLine" className="size-4" />
              <span className="truncate max-w-[220px]">
                {t("comments_replying_to")}
                {" "}
                #{replyTo.id}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancelReply}
              className="text-[11px] underline-offset-2 hover:underline"
            >
              {t("comments_cancel_reply")}
            </button>
          </div>
        )}

        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setContent(e.target.value);
              }
            }}
            placeholder={t("comments_placeholder")}
            className="min-h-[96px] text-sm"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {content.length} / 500
            </span>
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              disabled={submitting || !content.trim()}
              onClick={handleSubmit}
            >
              {submitting ? t("comments_submitting") : t("comments_submit")}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {comments.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">
            {t("comments_empty")}
          </p>
        )}

        {grouped.roots.map((root) => {
          const replies = grouped.childrenMap.get(root.id) || [];

          return (
            <div key={root.id} className="space-y-2">
              <div className="rounded-lg border bg-card p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap break-words flex-1">
                    {root.is_deleted
                      ? t("comments_deleted")
                      : root.content}
                  </p>
                  {!root.is_deleted && (
                    <div className="ml-2 flex flex-col items-end gap-1 text-[11px] text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => handleReply(root)}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Icon name="RiReplyLine" className="size-3.5" />
                        {t("comments_reply")}
                      </button>
                      {user && user.uuid === root.user_uuid && (
                        <button
                          type="button"
                          onClick={() => handleDelete(root)}
                          disabled={deletingId === root.id}
                          className="flex items-center gap-1 text-red-500 hover:text-red-600"
                        >
                          <Icon
                            name="RiDeleteBinLine"
                            className="size-3.5"
                          />
                          {t("comments_delete")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {replies.length > 0 && (
                <div className="ml-4 space-y-2 border-l pl-3">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-lg border bg-muted/60 p-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="whitespace-pre-wrap break-words flex-1">
                          {reply.is_deleted
                            ? t("comments_deleted")
                            : reply.content}
                        </p>
                        {!reply.is_deleted && (
                          <div className="ml-2 flex flex-col items-end gap-1 text-[11px] text-muted-foreground">
                            <button
                              type="button"
                              onClick={() => handleReply(reply)}
                              className="flex items-center gap-1 hover:text-foreground"
                            >
                              <Icon
                                name="RiReplyLine"
                                className="size-3.5"
                              />
                              {t("comments_reply")}
                            </button>
                            {user && user.uuid === reply.user_uuid && (
                              <button
                                type="button"
                                onClick={() => handleDelete(reply)}
                                disabled={deletingId === reply.id}
                                className="flex items-center gap-1 text-red-500 hover:text-red-600"
                              >
                                <Icon
                                  name="RiDeleteBinLine"
                                  className="size-3.5"
                                />
                                {t("comments_delete")}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {hasMore && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={loadingMore}
              onClick={() => loadPage(page + 1, true)}
            >
              {loadingMore ? t("comments_loading") : t("comments_load_more")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
