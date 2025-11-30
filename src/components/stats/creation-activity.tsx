"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

type DailyStoryStat = {
  date: string; // YYYY-MM-DD
  story_count: number;
  total_words: number;
};

interface CreationActivityProps {
  data: DailyStoryStat[];
}

function getIntensityClass(count: number) {
  if (count <= 0) return "bg-muted";
  if (count === 1) return "bg-emerald-100 dark:bg-emerald-900/40";
  if (count <= 3) return "bg-emerald-300 dark:bg-emerald-700";
  return "bg-emerald-500 dark:bg-emerald-500";
}

export default function CreationActivity({ data }: CreationActivityProps) {
  const t = useTranslations("creation_dashboard");

  // 调试日志
  console.log("=== CreationActivity Debug ===");
  console.log("data:", JSON.stringify(data, null, 2));

  const daysToShow = 30;

  const statsMap = useMemo(() => {
    const map = new Map<string, DailyStoryStat>();
    for (const item of data || []) {
      map.set(item.date, item);
    }
    return map;
  }, [data]);

  const today = new Date();
  const dayList = useMemo(() => {
    const list: { label: string; key: string; stat?: DailyStoryStat }[] = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const stat = statsMap.get(key);
      const label = key.slice(5); // MM-DD
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
    console.log("maxWords:", max);
    return max > 0 ? max : 1;
  }, [data]);

  const hasActivity = (data && data.length > 0) || false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            {t("activity.title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("activity.description")}
          </p>
        </div>
      </div>

      {hasActivity ? (
        <div className="space-y-6">
          {/* Calendar heatmap */}
          <div>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground mb-1">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div key={idx} className="text-center uppercase">
                  {t("activity.weekdays." + idx)}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {dayList.map((day, index) => {
                const count = day.stat?.story_count ?? 0;
                const intensity = getIntensityClass(count);
                const title = `${day.key} • ${t("activity.tooltip", {
                  date: day.key,
                  stories: count,
                  words: day.stat?.total_words ?? 0,
                })}`;
                return (
                  <div
                    key={day.key}
                    title={title}
                    className={
                      "h-6 rounded-sm border border-transparent transition-colors " +
                      intensity
                    }
                  />
                );
              })}
            </div>
          </div>

          {/* Trend chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t("activity.trend_title")}
              </span>
            </div>
            <div className="h-28 flex items-end gap-[1px]">
              {dayList.map((day, index) => {
                const value = Number(day.stat?.total_words) || 0;
                const ratio = value > 0 ? Math.max(value / maxWords, 0.05) : 0;
                // 用固定像素高度，父容器 h-28 = 112px
                const heightPx = Math.round(ratio * 96); // 留 16px 给标签
                
                // 每 5 个点、最后一个点、或有数据的点都显示标签
                const showLabel = index % 5 === 0 || index === dayList.length - 1 || value > 0;
                const title = `${day.key} • ${t("activity.tooltip", {
                  date: day.key,
                  stories: day.stat?.story_count ?? 0,
                  words: value,
                })}`;
                return (
                  <div
                    key={day.key}
                    className="flex-1 flex flex-col items-center justify-end gap-1 min-w-[4px]"
                    title={title}
                  >
                    <div
                      className="w-1/2 rounded-sm bg-indigo-400/80 dark:bg-indigo-500"
                      style={{ height: `${heightPx}px` }}
                    />
                    {showLabel && (
                      <div className="text-[9px] text-muted-foreground leading-none">
                        {day.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("activity.trend_hint")}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("activity.empty")}
        </p>
      )}
    </div>
  );
}
