"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { useTranslations } from "next-intl";

const StoryShareDialog = dynamic(
  () => import("@/components/story/story-share-dialog"),
  { ssr: false, loading: () => null }
);

/**
 * Reusable "Share result" button for any generator.
 * Wraps the Share button + StoryShareDialog + open state, so each generator
 * only needs to drop one `<ShareResultButton />` next to its Copy/Export actions.
 */
export default function ShareResultButton({
  content,
  prompt,
  title,
  sourceCategory,
  label,
  variant = "outline",
  size = "sm",
  className = "gap-1.5 text-xs",
  disabled,
}: {
  content: string;
  prompt?: string;
  title?: string;
  sourceCategory: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("share_dialog");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || !content || !content.trim()}
        onClick={() => setOpen(true)}
      >
        <Icon name="RiShareLine" className="size-3.5" />
        {label || t("button")}
      </Button>

      <StoryShareDialog
        open={open}
        onOpenChange={setOpen}
        story={{
          title: title || "",
          content,
          prompt: prompt || "",
          sourceCategory,
        }}
      />
    </>
  );
}
