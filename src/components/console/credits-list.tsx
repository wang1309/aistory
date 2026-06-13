"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  RiCoinLine,
  RiAddCircleLine,
  RiSubtractLine,
  RiArrowRightUpLine,
  RiGiftLine,
  RiSettings3Line,
  RiCalendarLine,
  RiPhoneLine,
  RiChat3Line,
} from "react-icons/ri";
import { Link } from "@/i18n/navigation";

interface CreditRecord {
  trans_no: string;
  trans_type: string;
  credits: number;
  created_at: string | Date | null;
  expired_at: string | Date | null;
  order_no?: string | null;
}

interface CreditsListProps {
  leftCredits: number;
  records: CreditRecord[];
  title: string;
  rechargeLabel: string;
  emptyMessage: string;
  labels: {
    trans_no: string;
    trans_type: string;
    credits: string;
    created_at: string;
    expired_at: string;
  };
}

function getTypeIcon(type: string) {
  switch (type) {
    case "new_user":
      return RiGiftLine;
    case "order_pay":
      return RiAddCircleLine;
    case "system_add":
      return RiSettings3Line;
    case "ping":
      return RiPhoneLine;
    case "chat_continue":
      return RiChat3Line;
    default:
      return RiCoinLine;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "new_user":
      return "New User Bonus";
    case "order_pay":
      return "Purchase";
    case "system_add":
      return "System Credit";
    case "ping":
      return "API Ping";
    case "chat_continue":
      return "AI Generation";
    default:
      return type;
  }
}

function formatDate(dateStr: string | Date | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(dateStr: string | Date | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Expires today";
  if (diffDays <= 30) return `${diffDays}d left`;
  const diffMonths = Math.ceil(diffDays / 30);
  return `${diffMonths}mo left`;
}

function CreditCard({
  record,
  index,
  labels,
}: {
  record: CreditRecord;
  index: number;
  labels: CreditsListProps["labels"];
}) {
  const [visible, setVisible] = useState(false);
  const isPositive = record.credits >= 0;
  const Icon = getTypeIcon(record.trans_type);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200 + index * 70);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0"
      )}
    >
      <div className="group relative rounded-2xl border border-border/40 bg-black/[0.02] p-1 dark:bg-white/[0.02]">
        <div className="relative flex items-center gap-4 rounded-[1.125rem] border border-border/30 bg-card px-4 py-3.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-border/60 group-hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] md:px-5 md:py-4">
          {/* Icon */}
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl md:size-10",
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
            )}
          >
            <Icon className="size-4 md:size-[18px]" />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">
              {getTypeLabel(record.trans_type)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {formatDate(record.created_at)}
            </p>
          </div>

          {/* Credits amount */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={cn(
                "text-sm font-bold tracking-tight md:text-base",
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-orange-600 dark:text-orange-400"
              )}
            >
              {isPositive ? "+" : ""}
              {record.credits.toLocaleString()}
            </span>
            {record.expired_at && (
              <span
                className={cn(
                  "text-[10px] font-medium",
                  formatRelative(record.expired_at) === "Expired"
                    ? "text-red-500/70"
                    : "text-muted-foreground/50"
                )}
              >
                {formatRelative(record.expired_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreditsList({
  leftCredits,
  records,
  title,
  rechargeLabel,
  emptyMessage,
  labels,
}: CreditsListProps) {
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    setHeaderVisible(true);
  }, []);

  const totalAdded = records
    .filter((r) => r.credits > 0)
    .reduce((sum, r) => sum + r.credits, 0);
  const totalUsed = records
    .filter((r) => r.credits < 0)
    .reduce((sum, r) => sum + Math.abs(r.credits), 0);

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
            <RiCoinLine className="size-4 text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
        </div>
      </div>

      {/* Balance Hero Card */}
      <div
        className={cn(
          "transition-all duration-700 delay-100 ease-[cubic-bezier(0.32,0.72,0,1)]",
          headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        )}
      >
        <div className="relative rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent p-1.5">
          <div className="relative rounded-[1.625rem] bg-card p-6 md:p-8">
            {/* Subtle glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                  Available Credits
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tighter md:text-6xl">
                    {leftCredits.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground/50">
                    credits
                  </span>
                </div>
              </div>

              <Link
                href={"/pricing" as any}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.97]"
              >
                {rechargeLabel}
                <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/20 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <RiArrowRightUpLine className="size-3" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {records.length > 0 && (
        <div
          className={cn(
            "grid grid-cols-2 gap-3 transition-all duration-700 delay-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
            headerVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}
        >
          <div className="rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
            <div className="rounded-[1.125rem] border border-border/30 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Total Earned
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                +{totalAdded.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
            <div className="rounded-[1.125rem] border border-border/30 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Total Used
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                -{totalUsed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      {records.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
            Transaction History
          </p>
          {records.map((record, i) => (
            <CreditCard key={record.trans_no} record={record} labels={labels} index={i} />
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
              <RiCoinLine className="size-6 text-muted-foreground/40" />
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
