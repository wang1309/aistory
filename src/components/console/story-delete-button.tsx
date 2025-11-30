"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface StoryDeleteButtonProps {
  uuid: string;
}

export default function StoryDeleteButton({ uuid }: StoryDeleteButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirmDelete = () => {
    startTransition(async () => {
      try {
        const resp = await fetch(`/api/stories/${uuid}`, {
          method: "DELETE",
        });

        if (!resp.ok) {
          throw new Error("request failed with status: " + resp.status);
        }

        const { code, message } = await resp.json();
        if (code !== 0) {
          toast.error(message || t("common.error"));
          return;
        }

        toast.success(t("my_stories.delete_story_success"));
        setOpen(false);
        router.push("/my-stories");
        router.refresh();
      } catch (e) {
        console.log("delete story failed", e);
        toast.error(t("common.error"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          {t("my_stories.delete_story")}
        </Button>
      </DialogTrigger>
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
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {t("my_stories.delete_story_confirm_cancel")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirmDelete}
            disabled={isPending}
          >
            {t("my_stories.delete_story_confirm_ok")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
