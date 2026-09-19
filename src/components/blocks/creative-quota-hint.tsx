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
  limit,
  className,
}: {
  pageKey: CreativePageKey;
  selectedModel: string | null | undefined;
  used: number;
  /** number = 已确认的真实 limit;null = 尚未加载,不渲染;undefined = 未接入,回退默认 */
  limit?: number | null;
  className?: string;
}) {
  const locale = useLocale();
  const { user } = useAppContext();
  const t = useTranslations("creative_quota");
  if (selectedModel !== "creative") return null;
  if (limit === null) return null;

  const effectiveLimit = limit ?? getCreativeLimit();
  const exhausted = used >= effectiveLimit;

  const text = exhausted && user
    ? t("credits_hint", { cost: CREATIVE_COST })
    : formatCreativeQuotaHint({ locale, used, limit: effectiveLimit });

  return (
    <div className={cn("text-center text-[10px] text-muted-foreground", className)}>
      {text}
    </div>
  );
}
