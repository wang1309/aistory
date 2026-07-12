"use client";

import { Check, Loader, ArrowRight, ChevronDown } from "lucide-react";
import { PricingItem, Pricing as PricingType } from "@/types/blocks/pricing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

export default function Pricing({ pricing }: { pricing: PricingType }) {
  const locale = useLocale();
  const { user, requireAuth } = useAppContext();

  const [group, setGroup] = useState(() => {
    return pricing.groups?.[1]?.name;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  const handleCheckout = async (item: PricingItem, cn_pay: boolean = false) => {
    try {
      if (!user) {
        requireAuth({ source: "pricing", action: "checkout" });
        return;
      }

      const params = {
        product_id: item.product_id,
        currency: cn_pay ? "cny" : item.currency,
        locale: locale || "en",
      };

      setIsLoading(true);
      setProductId(item.product_id);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (response.status === 401) {
        setIsLoading(false);
        setProductId(null);
        requireAuth({ source: "pricing", action: "checkout" });
        return;
      }

      const { code, message, data } = await response.json();
      if (code !== 0) {
        toast.error(message);
        return;
      }

      const { checkout_url } = data;
      if (!checkout_url) {
        toast.error("checkout failed");
        return;
      }

      window.location.href = checkout_url;
    } catch (e) {
      console.log("checkout failed: ", e);
      toast.error("checkout failed");
    } finally {
      setIsLoading(false);
      setProductId(null);
    }
  };

  useEffect(() => {
    if (pricing.items) {
      const featuredItem = pricing.items.find((i) => i.is_featured);
      setProductId(featuredItem?.product_id || pricing.items[0]?.product_id);
      setIsLoading(false);
    }
  }, [pricing.items]);

  if (pricing.disabled) {
    return null;
  }

  const visibleItems =
    pricing.items?.filter((item) => !item.group || item.group === group) || [];

  return (
    <section id={pricing.name} className="relative py-24 md:py-32 lg:py-40">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center md:mb-20">
          <div className="mb-6 inline-flex items-center rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {pricing.label}
          </div>
          <h2 className="mb-5 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {pricing.title}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            {pricing.description}
          </p>
        </div>

        {/* Group Toggle */}
        {pricing.groups && pricing.groups.length > 0 && (
          <div className="mb-14 flex justify-center md:mb-16">
            <div className="inline-flex items-center rounded-2xl border border-border/50 bg-muted/60 p-1.5">
              <RadioGroup
                value={group}
                className="flex h-11 gap-1"
                onValueChange={(value) => setGroup(value)}
              >
                {pricing.groups.map((item, i) => (
                  <div
                    key={i}
                    className="relative h-full rounded-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] has-[button[data-state='checked']]:bg-background has-[button[data-state='checked']]:shadow-sm"
                  >
                    <RadioGroupItem
                      value={item.name || ""}
                      id={item.name}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={item.name}
                      className="flex h-full cursor-pointer items-center gap-2 px-5 text-sm font-semibold text-muted-foreground transition-colors duration-500 peer-data-[state=checked]:text-foreground"
                    >
                      {item.title}
                      {item.label && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {item.label}
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div
          className={cn(
            "grid gap-5 md:gap-6",
            visibleItems.length === 1 && "md:grid-cols-1 md:max-w-md md:mx-auto",
            visibleItems.length === 2 && "md:grid-cols-2",
            visibleItems.length >= 3 && "md:grid-cols-3"
          )}
        >
          {pricing.items?.map((item, index) => {
            if (item.group && item.group !== group) return null;

            const isFeatured = item.is_featured;

            return (
              <div
                key={index}
                className={cn(
                  "group/card relative rounded-3xl p-2 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  isFeatured
                    ? "md:-mt-4 md:mb-4 md:scale-[1.03]"
                    : "hover:-translate-y-1"
                )}
              >
                {/* Outer glow for featured */}
                {isFeatured && (
                  <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent opacity-60" />
                )}

                {/* Card body */}
                <div
                  className={cn(
                    "relative h-full rounded-[1.25rem] p-6 md:p-8",
                    isFeatured
                      ? "bg-gradient-to-b from-primary/[0.07] to-card border border-primary/20 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]"
                      : "bg-card border border-border/60 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)]"
                  )}
                >
                  <div className="flex h-full flex-col justify-between gap-8">
                    {/* Top section */}
                    <div>
                      {/* Title row */}
                      <div className="mb-6 flex items-center gap-3">
                        <h3 className="text-lg font-bold tracking-tight">
                          {item.title}
                        </h3>
                        {item.label && (
                          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                            {item.label}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mb-2 flex items-end gap-2">
                        {item.original_price && (
                          <span className="mb-1 text-lg font-medium text-muted-foreground/50 line-through decoration-1">
                            {item.original_price}
                          </span>
                        )}
                        {item.price && (
                          <span className="text-5xl font-extrabold tracking-tight md:text-[3.5rem]">
                            {item.price}
                          </span>
                        )}
                        {item.unit && (
                          <span className="mb-1.5 text-sm font-medium text-muted-foreground">
                            {item.unit}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      )}

                      {/* Features */}
                      {item.features && item.features.length > 0 && (
                        <div className="mt-8">
                          {item.features_title && (
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                              {item.features_title}
                            </p>
                          )}
                          <ul className="flex flex-col gap-3">
                            {item.features.map((feature, fi) => (
                              <li
                                key={`feature-${fi}`}
                                className="flex items-start gap-3 text-sm"
                              >
                                <span
                                  className={cn(
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                                    isFeatured
                                      ? "bg-primary/15 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  <Check className="size-3" strokeWidth={2.5} />
                                </span>
                                <span className={fi === 1 && feature.toLowerCase().includes("x more") || feature.includes("倍") ? "font-semibold text-foreground" : "text-muted-foreground"}>
                                  {feature}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Bottom section */}
                    <div className="flex flex-col gap-3">
                      {/* CN Pay */}
                      {item.cn_amount && item.cn_amount > 0 && (
                        <div className="flex items-center gap-x-2">
                          <span className="text-xs text-muted-foreground">
                            人民币支付
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <div
                            className="inline-block cursor-pointer rounded-lg p-1.5 transition-colors duration-300 hover:bg-muted"
                            onClick={() => {
                              if (isLoading) return;
                              handleCheckout(item, true);
                            }}
                          >
                            <img
                              src="/imgs/cnpay.png"
                              alt="cnpay"
                              className="h-8 w-16 rounded-md"
                            />
                          </div>
                        </div>
                      )}

                      {/* CTA Button */}
                      {item.button && (
                        <Button
                          className={cn(
                            "group relative h-12 w-full overflow-hidden rounded-xl text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                            isFeatured
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:scale-[0.98]"
                          )}
                          disabled={isLoading}
                          onClick={() => {
                            if (isLoading) return;
                            handleCheckout(item);
                          }}
                        >
                          {isLoading && productId === item.product_id && (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <span>{item.button.title}</span>
                          {item.button.icon && (
                            <Icon
                              name={item.button.icon}
                              className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-background/20 p-0.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px"
                            />
                          )}
                        </Button>
                      )}

                      {item.tip && (
                        <p className="text-center text-xs text-muted-foreground/70">
                          {item.tip}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        {pricing.faq && pricing.faq.length > 0 && (
          <div className="mx-auto mt-20 max-w-3xl md:mt-24">
            <h3 className="mb-10 text-center font-display text-2xl font-bold tracking-tight md:text-3xl">
              Frequently Asked Questions
            </h3>
            <div className="flex flex-col gap-3">
              {pricing.faq.map((item, i) => (
                <FAQItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        open
          ? "border-primary/20 bg-primary/[0.03] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]"
          : "border-border/50 bg-card hover:border-border/80"
      )}
    >
      <button
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold tracking-tight md:text-base">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open && "rotate-180 text-primary"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
