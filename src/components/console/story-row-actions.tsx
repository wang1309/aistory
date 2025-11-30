"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoreHorizontal } from "lucide-react";

interface StoryRowActionsProps {
  uuid: string;
  title: string;
  untitledLabel: string;
}

export default function StoryRowActions({
  uuid,
  title,
  untitledLabel,
}: StoryRowActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [value, setValue] = useState(title || "");
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const refreshCurrentPage = () => {
    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.replace(url, { scroll: false });
  };

  const handleOpenEdit = () => {
    setValue(title || "");
    setEditOpen(true);
  };

  const handleSave = () => {
    const newTitle = value.trim();

    startSaving(async () => {
      try {
        const resp = await fetch(`/api/stories/${uuid}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: newTitle }),
        });

        if (!resp.ok) {
          throw new Error("request failed with status: " + resp.status);
        }

        const { code, message } = await resp.json();
        if (code !== 0) {
          toast.error(message || t("common.error"));
          return;
        }

        toast.success(t("my_stories.edit_title_success"));
        setEditOpen(false);
        refreshCurrentPage();
      } catch (e) {
        console.log("update story title failed", e);
        toast.error(t("common.error"));
      }
    });
  };

  const handleConfirmDelete = () => {
    startDeleting(async () => {
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
        setDeleteOpen(false);
        refreshCurrentPage();
      } catch (e) {
        console.log("delete story failed", e);
        toast.error(t("common.error"));
      }
    });
  };

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={handleOpenEdit}>
            {t("my_stories.edit_title")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            {t("my_stories.delete_story")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {t("my_stories.edit_title_save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("my_stories.delete_story_confirm_title")}
            </DialogTitle>
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
              onClick={handleConfirmDelete}
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
