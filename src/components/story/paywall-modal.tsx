"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import type { PricingItem } from "@/types/blocks/pricing";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * 积分不足 paywall 弹窗(高级版)
 * - Ethereal Glass:primary 径向光晕 + 玻璃质感
 * - Z-Axis Cascade:套餐卡片堆叠,推荐项 gradient border + 角标
 * - Double-Bezel:每个套餐外壳 + 内核
 * - 点击套餐直接 /api/checkout 跳支付页;CTA "查看全部"跳 /pricing
 */
export default function PaywallModal({ open, onClose }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("story_paywall");
  const { user, requireAuth } = useAppContext();
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/pricing?locale=${locale}`)
      .then((r) => r.json())
      .then(({ data }) => {
        // getPricingPage 返回整个 page json,结构是 { pricing: { items: [...] } }
        const pricingObj = data?.pricing || data;
        const all: PricingItem[] = (pricingObj && pricingObj.items) || [];
        const packs = all.filter((i) => i.group === "trial").slice(0, 3);
        setItems(packs.length ? packs : all.slice(0, 3));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open, locale]);

  const handleCheckout = async (item: PricingItem) => {
    // paywall 触发时用户应已登录,但 session 可能过期
    if (!user) {
      requireAuth({ source: "paywall", action: "checkout" });
      return;
    }
    if (checkingOut) return;
    try {
      setCheckingOut(item.product_id);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.product_id,
          currency: item.currency,
          locale,
        }),
      });
      if (response.status === 401) {
        requireAuth({ source: "paywall", action: "checkout" });
        return;
      }
      const { code, message, data } = await response.json();
      if (code !== 0 || !data?.checkout_url) {
        toast.error(message || t("checkout_failed"));
        return;
      }
      window.location.href = data.checkout_url;
    } catch (e) {
      console.log("paywall checkout failed:", e);
      toast.error(t("checkout_failed"));
    } finally {
      setCheckingOut(null);
    }
  };

  const goPricing = () => {
    onClose();
    router.push("/pricing");
  };

  // 推荐套餐:优先 is_featured,否则第二个(中间位最自然),否则第一个
  const featuredIdx = items.findIndex((i) => i.is_featured);
  const recommendIdx =
    featuredIdx >= 0 ? featuredIdx : items.length > 1 ? 1 : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-[420px] gap-0 overflow-hidden rounded-[1.75rem] border-0 p-0 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)]"
      >
        {/* 径向光晕背景层(primary 色,营造高级感) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-20 size-52 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 size-48 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative px-7 pb-6 pt-7">
          {/* eyebrow tag */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            {t("eyebrow")}
          </div>

          {/* 标题区 */}
          <DialogHeader className="mt-4 space-y-0 text-left">
            <DialogTitle className="text-[22px] font-semibold leading-tight tracking-tight">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[13px] leading-relaxed">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          {/* 套餐卡片(点击直接 checkout) */}
          <div className="mt-5 space-y-2.5">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t("loading")}
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t("empty")}
              </div>
            ) : (
              items.map((item, i) => {
                const isRec = i === recommendIdx;
                const isChecking = checkingOut === item.product_id;
                return (
                  <button
                    key={item.product_id}
                    type="button"
                    onClick={() => handleCheckout(item)}
                    disabled={!!checkingOut}
                    className={`group relative block w-full rounded-2xl p-[1px] text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:cursor-not-allowed ${
                      isRec
                        ? "bg-gradient-to-br from-primary/60 via-primary/30 to-primary/10"
                        : "bg-foreground/[0.06] hover:bg-foreground/[0.1]"
                    }`}
                  >
                    {/* 推荐角标 */}
                    {isRec && (
                      <div className="absolute -top-2 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
                        <Sparkles className="size-2.5" />
                        {t("popular")}
                      </div>
                    )}
                    {/* 内核 */}
                    <div
                      className={`flex items-center justify-between rounded-[calc(1rem-1px)] px-4 py-3 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 ${
                        isRec
                          ? "bg-background/80 backdrop-blur-sm"
                          : "bg-background/60 group-hover:bg-background"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {item.title}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {typeof item.credits === "number"
                            ? `${item.credits.toLocaleString()} ${t("credits")}`
                            : ""}
                          {item.tip ? ` · ${item.tip}` : ""}
                        </div>
                      </div>
                      <div className="ml-3 flex items-center gap-2 whitespace-nowrap">
                        {isChecking ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <span
                            className={`text-base font-bold ${
                              isRec ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {item.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* 主 CTA(查看全部套餐) */}
          <button
            onClick={goPricing}
            disabled={!!checkingOut}
            className="group mt-6 flex w-full items-center justify-between rounded-full bg-foreground px-5 py-3.5 text-sm font-semibold text-background transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-[oklch(0.20_0.02_55)]"
          >
            <span>{t("view_all")}</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-background/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 dark:bg-black/10">
              <ArrowRight className="size-3.5" />
            </span>
          </button>

          {/* 次要(文字链接,降低视觉权重) */}
          <button
            onClick={onClose}
            disabled={!!checkingOut}
            className="mt-1 w-full py-2 text-center text-xs text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:opacity-50"
          >
            {t("later")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
