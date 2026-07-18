"use client";

import type { CreativePageKey } from "@/lib/creative-quota-core";
import { formatCreativeQuotaHint } from "@/lib/creative-quota-core";
import { getCreativeLimit } from "@/lib/creative-quota-client";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

export function CreativeQuotaHint({
  pageKey,
  selectedModel,
  used,
  className,
}: {
  pageKey: CreativePageKey;
  selectedModel: string | null | undefined;
  used: number;
  className?: string;
}) {
  const locale = useLocale();
  if (selectedModel !== "creative") return null;

  const limit = getCreativeLimit();
  return (
    <div className={cn("text-center text-[10px] text-muted-foreground", className)}>
      {formatCreativeQuotaHint({
        locale,
        used,
        limit,
      })}
    </div>
  );
}
