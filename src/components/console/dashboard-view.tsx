"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import {
  RiBookOpenLine,
  RiFileTextLine,
  RiCalendarCheckLine,
  RiFireLine,
} from "react-icons/ri";

interface StatCard {
  key: string;
  title: string;
  value: string;
  description: string;
}

interface DailyStoryStat {
  date: string;
  story_count: number;
  total_words: number;
}

interface DashboardViewProps {
  title: string;
  description: string;
  stats: StatCard[];
  dailyStats: DailyStoryStat[];
  activityLabels: {
    title: string;
    description: string;
    weekdays: string[];
    tooltip: string;
    trend_title: string;
    trend_hint: string;
    empty: string;
  };
}

const ICON_MAP: Record<string, React.ElementType> = {
  total_stories: RiBookOpenLine,
  total_words: RiFileTextLine,
  creation_days: RiCalendarCheckLine,
  streak: RiFireLine,
};

const ACCENT_MAP: Record<string, string> = {
  total_stories: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  total_words: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  creation_days: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  streak: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const GLOW_MAP: Record<string, string> = {
  total_stories: "bg-indigo-500/[0.03]",
  total_words: "bg-emerald-500/[0.03]",
  creation_days: "bg-amber-500/[0.03]",
  streak: "bg-rose-500/[0.03]",
};

function StatCardComponent({
  card,
  index,
}: {
  card: StatCard;
  index: number;
}) {
  const [visible, setVisible] = useState(false);
  const Icon = ICON_MAP[card.key] || RiBookOpenLine;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
    >
      <div className="relative rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
        <div className={cn("relative rounded-[1.125rem] border border-border/30 bg-card p-5 md:p-6 overflow-hidden")}>
          {/* Subtle glow */}
          <div className={cn("pointer-events-none absolute -right-8 -top-8 size-28 rounded-full blur-3xl opacity-60", GLOW_MAP[card.key] || "bg-primary/[0.03]")} />

          <div className="relative">
            <div className="mb-4 flex items-center gap-2.5">
              <div className={cn("flex size-9 items-center justify-center rounded-xl", ACCENT_MAP[card.key] || "bg-primary/10 text-primary")}>
                <Icon className="size-[18px]" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                {card.title}
              </span>
            </div>
            <p className="text-3xl font-extrabold tracking-tighter md:text-4xl">
              {card.value}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground/60">
              {card.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityHeatmap({ data, labels }: { data: DailyStoryStat[]; labels: DashboardViewProps["activityLabels"] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const statsMap = useMemo(() => {
    const map = new Map<string, DailyStoryStat>();
    for (const item of data || []) {
      map.set(item.date, item);
    }
    return map;
  }, [data]);

  const today = useMemo(() => new Date(), []);
  const daysToShow = 30;

  const dayList = useMemo(() => {
    const list: { key: string; label: string; stat?: DailyStoryStat }[] = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const stat = statsMap.get(key);
      const label = key.slice(5);
      list.push({ key, label, stat });
    }
    return list;
  }, [today, statsMap]);

  const maxWords = useMemo(() => {
    let max = 0;
    for (const item of data || []) {
      const words = Number(item.total_words) || 0;
      if (words > max) max = words;
    }
    return max > 0 ? max : 1;
  }, [data]);

  const hasActivity = (data && data.length > 0) || false;

  function getIntensityClass(count: number) {
    if (count <= 0) return "bg-muted/40";
    if (count === 1) return "bg-emerald-200 dark:bg-emerald-900/50";
    if (count <= 3) return "bg-emerald-400 dark:bg-emerald-700";
    return "bg-emerald-500 dark:bg-emerald-500";
  }

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
    >
      <div className="relative rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
        <div className="relative rounded-[1.125rem] border border-border/30 bg-card p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">{labels.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground/60">{labels.description}</p>
            </div>
            {hasActivity && (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={cn("size-3 rounded-[3px]", getIntensityClass(level))}
                  />
                ))}
                <span className="ml-1 text-[10px] text-muted-foreground/40">Less</span>
              </div>
            )}
          </div>

          {hasActivity ? (
            <div className="space-y-8">
              {/* Heatmap */}
              <div>
                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                  {labels.weekdays.map((day, idx) => (
                    <div key={idx} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground/40">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {dayList.map((day) => {
                    const count = day.stat?.story_count ?? 0;
                    return (
                      <div
                        key={day.key}
                        title={labels.tooltip
                          .replace("{date}", day.key)
                          .replace("{stories}", String(count))
                          .replace("{words}", String(day.stat?.total_words ?? 0))}
                        className={cn(
                          "aspect-square rounded-lg border border-transparent transition-all duration-300",
                          getIntensityClass(count),
                          count > 0 && "hover:scale-110 hover:border-emerald-500/30"
                        )}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Trend */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground/70">
                    {labels.trend_title}
                  </span>
                </div>
                <div className="flex h-24 items-end gap-[2px]">
                  {dayList.map((day, index) => {
                    const value = Number(day.stat?.total_words) || 0;
                    const ratio = value > 0 ? Math.max(value / maxWords, 0.08) : 0;
                    const heightPx = Math.round(ratio * 80);
                    const showLabel = index % 7 === 0 || index === dayList.length - 1;

                    return (
                      <div
                        key={day.key}
                        className="flex flex-1 flex-col items-center justify-end gap-1 min-w-[3px]"
                        title={labels.tooltip
                          .replace("{date}", day.key)
                          .replace("{stories}", String(day.stat?.story_count ?? 0))
                          .replace("{words}", String(value))}
                      >
                        <div
                          className={cn(
                            "w-full max-w-[8px] rounded-t-sm transition-all duration-300",
                            value > 0
                              ? "bg-indigo-400/70 dark:bg-indigo-500/80"
                              : "bg-muted/30"
                          )}
                          style={{ height: `${heightPx}px` }}
                        />
                        {showLabel && (
                          <span className="text-[8px] text-muted-foreground/30 leading-none">
                            {day.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground/40">
                  {labels.trend_hint}
                </p>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-muted-foreground/50">
              {labels.empty}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardView({
  title,
  description,
  stats,
  dailyStats,
  activityLabels,
}: DashboardViewProps) {
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    setHeaderVisible(true);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className={cn(
          "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          headerVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        )}
      >
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground/60">{description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        {stats.map((card, i) => (
          <StatCardComponent key={card.key} card={card} index={i} />
        ))}
      </div>

      {/* Activity */}
      <ActivityHeatmap data={dailyStats} labels={activityLabels} />
    </div>
  );
}
