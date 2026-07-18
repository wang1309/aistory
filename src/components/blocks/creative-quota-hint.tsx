"use client";

import type { CreativePageKey } from "@/lib/creative-quota-core";
import { formatCreativeQuotaHint } from "@/lib/creative-quota-core";
import { getCreativeLimit } from "@/lib/creative-quota-client";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";

const CREATIVE_COST = 5;

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
  const { user } = useAppContext();
  const t = useTranslations("creative_quota");
  if (selectedModel !== "creative") return null;

  const limit = getCreativeLimit();
  const exhausted = used >= limit;

  const text = exhausted && user
    ? t("credits_hint", { cost: CREATIVE_COST })
    : formatCreativeQuotaHint({ locale, used, limit });

  return (
    <div className={cn("text-center text-[10px] text-muted-foreground", className)}>
      {text}
    </div>
  );
}
