"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";

interface StoryLikeButtonProps {
  storyUuid: string;
  size?: "sm" | "md";
}

interface LikeState {
  liked: boolean;
  likesCount: number;
}

export default function StoryLikeButton({
  storyUuid,
  size = "md",
}: StoryLikeButtonProps) {
  const { user, setShowSignModal } = useAppContext();
  const [state, setState] = useState<LikeState>({ liked: false, likesCount: 0 });
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchInitial() {
      try {
        const resp = await fetch(`/api/stories/${storyUuid}/like`, {
          method: "GET",
        });

        const json = await resp.json().catch(() => null);

        if (!resp.ok || !json || json.code !== 0 || !json.data) {
          return;
        }

        if (!cancelled) {
          setState({
            liked: Boolean(json.data.liked),
            likesCount: Number(json.data.likesCount ?? 0),
          });
          setInitialLoaded(true);
        }
      } catch (e) {
        console.log("fetch story likes failed", e);
      }
    }

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [storyUuid]);

  const handleToggle = useCallback(async () => {
    if (!user) {
      setShowSignModal(true);
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const method = state.liked ? "DELETE" : "POST";

      const resp = await fetch(`/api/stories/${storyUuid}/like`, {
        method,
      });

      const json = await resp.json().catch(() => null);

      if (!resp.ok || !json) {
        throw new Error("request failed");
      }

      if (json.code !== 0) {
        if (json.message === "no auth") {
          setShowSignModal(true);
          return;
        }

        toast.error(json.message || "Failed to update like status");
        return;
      }

      if (!json.data) {
        return;
      }

      setState({
        liked: Boolean(json.data.liked),
        likesCount: Number(json.data.likesCount ?? 0),
      });
    } catch (e) {
      console.log("toggle like failed", e);
      toast.error("操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [user, setShowSignModal, loading, state.liked, storyUuid]);

  const iconName = state.liked ? "RiHeart3Fill" : "RiHeart3Line";
  const countLabel = initialLoaded ? state.likesCount.toString() : "";

  const sizeClasses =
    size === "sm"
      ? "h-7 px-2 text-xs"
      : "h-8 px-3 text-xs md:text-sm";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={`gap-1 rounded-full border border-transparent hover:border-rose-200/60 hover:bg-rose-50/60 dark:hover:bg-rose-950/40 ${sizeClasses} ${
        state.liked ? "text-rose-500" : "text-muted-foreground"
      }`}
      aria-pressed={state.liked}
   >
      <Icon
        name={iconName}
        className={`size-3.5 md:size-4 ${state.liked ? "text-rose-500" : ""}`}
      />
      {countLabel && <span className="tabular-nums">{countLabel}</span>}
    </Button>
  );
}
