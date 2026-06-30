"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Icon from "@/components/icon";
import { useTranslations } from "next-intl";
import {
  TwitterShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TwitterIcon,
  FacebookIcon,
  LinkedinIcon,
} from "react-share";
import type { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";

const TurnstileInvisible = dynamic(() => import("@/components/TurnstileInvisible"), {
  ssr: false,
  loading: () => null,
});

export interface ShareStoryInput {
  title: string;
  content: string;
  prompt: string;
  settings?: Record<string, unknown> | null;
  sourceCategory?: string;
}

interface CreatedShare {
  share_id: string;
  url: string;
  delete_token: string;
}

const DELETE_TOKEN_KEY = "share:delete-tokens";

function rememberDeleteToken(shareId: string, token: string) {
  try {
    const raw = window.localStorage.getItem(DELETE_TOKEN_KEY) || "{}";
    const map = JSON.parse(raw);
    map[shareId] = token;
    window.localStorage.setItem(DELETE_TOKEN_KEY, JSON.stringify(map));
  } catch {
    // ignore storage failures
  }
}

export default function StoryShareDialog({
  open,
  onOpenChange,
  story,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  story: ShareStoryInput;
}) {
  const t = useTranslations("share_dialog");
  const [phase, setPhase] = useState<"idle" | "creating" | "done">("idle");
  const [created, setCreated] = useState<CreatedShare | null>(null);
  const [deleting, setDeleting] = useState(false);
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setPhase("idle");
      setCreated(null);
    }
    onOpenChange(v);
  };

  const startCreate = () => {
    setPhase("creating");
    turnstileRef.current?.execute();
  };

  const mapError = (msg?: string): string => {
    if (msg?.includes("verification")) return t("error_verify");
    if (msg?.includes("blocked")) return t("error_blocked");
    return t("error_create");
  };

  const onCreateWithToken = useCallback(
    async (token: string) => {
      try {
        const resp = await fetch("/api/story-share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: story.title,
            content: story.content,
            prompt: story.prompt,
            settings: story.settings ?? null,
            sourceCategory: story.sourceCategory ?? "story",
            turnstileToken: token,
          }),
        });
        const data = await resp.json();
        if (data.code !== 0) {
          toast.error(mapError(data.message));
          setPhase("idle");
          return;
        }
        const c: CreatedShare = data.data;
        rememberDeleteToken(c.share_id, c.delete_token);
        setCreated(c);
        setPhase("done");
        toast.success(t("created"));
      } catch {
        toast.error(t("error_create"));
        setPhase("idle");
      }
    },
    [story, t]
  );

  const handleCopy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      toast.success(t("copied"));
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!created) return;
    if (!window.confirm(t("confirm_delete"))) return;
    setDeleting(true);
    try {
      const resp = await fetch(`/api/story-share/${created.share_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteToken: created.delete_token }),
      });
      const data = await resp.json();
      if (data.code === 0) {
        toast.success(t("deleted"));
        handleOpenChange(false);
      } else {
        toast.error(t("error_delete"));
      }
    } catch {
      toast.error(t("error_delete"));
    } finally {
      setDeleting(false);
    }
  };

  const shareText = t("share_text");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("desc")}</DialogDescription>
        </DialogHeader>

        {phase !== "done" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("warning")}</p>
            <Button
              onClick={startCreate}
              disabled={phase === "creating"}
              className="w-full"
            >
              {phase === "creating" ? t("creating") : t("create_button")}
            </Button>
          </div>
        )}

        {phase === "done" && created && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={created.url}
                onFocus={(e) => e.currentTarget.select()}
                className="h-10 flex-1 rounded-md border bg-muted/40 px-3 text-sm outline-none"
              />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                <Icon name="RiLinkLine" className="size-4" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <TwitterShareButton url={created.url} title={shareText}>
                <TwitterIcon size={32} round />
              </TwitterShareButton>
              <FacebookShareButton url={created.url}>
                <FacebookIcon size={32} round />
              </FacebookShareButton>
              <LinkedinShareButton url={created.url}>
                <LinkedinIcon size={32} round />
              </LinkedinShareButton>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={created.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Icon name="RiExternalLinkLine" className="size-3.5" />
                {t("open")}
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Icon name="RiDeleteBinLine" className="size-3.5 mr-1" />
                {t("delete")}
              </Button>
            </div>
          </div>
        )}

        <TurnstileInvisible
          ref={turnstileRef}
          onSuccess={onCreateWithToken}
          onError={() => {
            toast.error(t("error_verify"));
            setPhase("idle");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
