"use client";

import type { CreativePageKey } from "@/lib/creative-quota-core";
import {
  formatCreativeQuotaHint,
  isQuotaTier,
} from "@/lib/creative-quota-core";
import {
  getQuotaCreditCost,
  getQuotaLimit,
} from "@/lib/creative-quota-client";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";

export function CreativeQuotaHint({
  pageKey,
  selectedModel,
  used,
  limit,
  creditCost,
  className,
}: {
  pageKey: CreativePageKey;
  selectedModel: string | null | undefined;
  used: number;
  /** number = 已确认的真实 limit;null = 尚未加载,不渲染;undefined = 未接入,回退默认 */
  limit?: number | null;
  /** 当前档位额度用完后每次生成消耗的积分;未传时按档位回退默认值 */
  creditCost?: number | null;
  className?: string;
}) {
  const locale = useLocale();
  const { user } = useAppContext();
  const t = useTranslations("creative_quota");
  if (!isQuotaTier(selectedModel)) return null;
  if (limit === null) return null;

  const effectiveLimit = limit ?? getQuotaLimit(selectedModel);
  const exhausted = used >= effectiveLimit;
  const effectiveCost = creditCost ?? getQuotaCreditCost(selectedModel);

  const text =
    exhausted && user
      ? t("credits_hint", { cost: effectiveCost })
      : formatCreativeQuotaHint({ locale, used, limit: effectiveLimit });

  return (
    <div className={cn("text-center text-[10px] text-muted-foreground", className)}>
      {text}
    </div>
  );
}
