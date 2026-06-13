"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { RiFileList3Line, RiCalendarLine, RiTimeLine, RiLinksLine } from "react-icons/ri";
import Link from "next/link";

interface OrderItem {
  order_no: string;
  paid_email?: string | null;
  product_name?: string | null;
  amount: number;
  currency?: string | null;
  interval?: string | null;
  paid_at: string | Date | null;
  status?: string | null;
  credits: number;
  stripe_session_id?: string | null;
  sub_id?: string | null;
  paid_detail?: string | null;
  billing_url?: string;
}

interface OrdersListProps {
  orders: OrderItem[];
  title: string;
  emptyMessage: string;
  labels: {
    order_no: string;
    email: string;
    product_name: string;
    amount: string;
    interval: string;
    paid_at: string;
    manage_billing: string;
    interval_month: string;
    interval_year: string;
    interval_one_time: string;
  };
}

function formatAmount(amount: number, currency?: string | null) {
  const symbol = currency?.toUpperCase() === "CNY" ? "¥" : "$";
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

function formatDate(dateStr: string | Date | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getIntervalLabel(interval: string | null | undefined, labels: OrdersListProps["labels"]) {
  if (interval === "month") return labels.interval_month;
  if (interval === "year") return labels.interval_year;
  return labels.interval_one_time;
}

function StatusBadge({ status }: { status?: string | null }) {
  const isPaid = status === "paid";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        isPaid
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isPaid ? "bg-emerald-500" : "bg-amber-500"
        )}
      />
      {isPaid ? "Paid" : status || "Pending"}
    </span>
  );
}

function OrderCard({
  order,
  labels,
  index,
}: {
  order: OrderItem;
  labels: OrdersListProps["labels"];
  index: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60 + index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      )}
    >
      <div className="group relative rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
        <div className="relative rounded-[1.125rem] border border-border/30 bg-card p-5 md:p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-border/60 group-hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-4">
            {/* Top row: product + status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <RiFileList3Line className="size-[18px]" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold tracking-tight">
                    {order.product_name || labels.order_no}
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground/70 font-mono">
                    {order.order_no}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={order.status} />
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <RiCalendarLine className="size-3.5 opacity-60" />
                {formatDate(order.paid_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <RiTimeLine className="size-3.5 opacity-60" />
                {getIntervalLabel(order.interval, labels)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <RiLinksLine className="size-3.5 opacity-60" />
                {order.credits?.toLocaleString()} credits
              </span>
            </div>

            {/* Bottom row: amount + billing */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight">
                  {formatAmount(order.amount, order.currency)}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  {order.currency?.toUpperCase()}
                </span>
              </div>
              {order.billing_url && (
                <Link
                  href={order.billing_url}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-full border border-border/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-primary/30 hover:text-primary hover:bg-primary/5 active:scale-[0.97]"
                >
                  {labels.manage_billing}
                  <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersList({ orders, title, emptyMessage, labels }: OrdersListProps) {
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    setHeaderVisible(true);
  }, []);

  const totalSpent = orders.reduce((sum, o) => (o.status === "paid" ? sum + o.amount : sum), 0);
  const currency = orders[0]?.currency?.toUpperCase() === "CNY" ? "¥" : "$";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className={cn(
          "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          headerVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        )}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <RiFileList3Line className="size-4 text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
        </div>
      </div>

      {/* Stats */}
      {orders.length > 0 && (
        <div
          className={cn(
            "grid grid-cols-2 gap-3 transition-all duration-700 delay-100 ease-[cubic-bezier(0.32,0.72,0,1)]",
            headerVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}
        >
          <div className="rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
            <div className="rounded-[1.125rem] border border-border/30 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Total Orders
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{orders.length}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
            <div className="rounded-[1.125rem] border border-border/30 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Total Spent
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {currency}{(totalSpent / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Cards */}
      {orders.length > 0 ? (
        <div className="flex flex-col gap-3">
          {orders.map((order, i) => (
            <OrderCard key={order.order_no} order={order} labels={labels} index={i} />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02] transition-all duration-700 delay-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
            headerVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}
        >
          <div className="flex flex-col items-center justify-center rounded-[1.125rem] border border-dashed border-border/40 bg-card py-20">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
              <RiFileList3Line className="size-6 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground/60">
              {emptyMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
