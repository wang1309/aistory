"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlotStorage, MAX_PLOTS_LIMIT } from "@/lib/plot-storage";
import type { PlotData } from "@/types/plot";
import { Clock, Trash2, FileText, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS, ja, ko, de } from "date-fns/locale";

interface Props {
  onLoadPlot: (plot: PlotData) => void;
  locale: string;
}

export default function PlotHistoryDropdown({ onLoadPlot, locale }: Props) {
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [open, setOpen] = useState(false);

  // Load plots list
  const loadPlots = () => {
    const loadedPlots = PlotStorage.getPlots();
    setPlots(loadedPlots);
  };

  // Load data when dropdown opens
  useEffect(() => {
    if (open) {
      loadPlots();
    }
  }, [open]);

  // Load plot
  const handleLoadPlot = (plot: PlotData) => {
    onLoadPlot(plot);
    setOpen(false);
  };

  // Delete plot
  const handleDeletePlot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    PlotStorage.deletePlot(id);
    loadPlots();
  };

  // Get date-fns locale
  const getDateLocale = () => {
    const localeMap: Record<string, any> = {
      zh: zhCN,
      en: enUS,
      ja: ja,
      ko: ko,
      de: de
    };
    return localeMap[locale] || enUS;
  };

  // Get translation
  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      myPlots: {
        zh: '我的大纲',
        ja: 'マイプロット',
        ko: '내 플롯',
        de: 'Meine Plots',
        en: 'My Plots'
      },
      recentPlots: {
        zh: '最近的大纲',
        ja: '最近のプロット',
        ko: '최근 플롯',
        de: 'Letzte Plots',
        en: 'Recent Plots'
      },
      noPlots: {
        zh: '还没有保存的大纲',
        ja: '保存されたプロットはありません',
        ko: '저장된 플롯이 없습니다',
        de: 'Keine gespeicherten Plots',
        en: 'No saved plots yet'
      },
      createPlot: {
        zh: '创建一个大纲来开始',
        ja: 'プロットを作成して始めましょう',
        ko: '플롯을 만들어 시작하세요',
        de: 'Erstellen Sie einen Plot, um zu beginnen',
        en: 'Create a plot to get started'
      },
      plotPoints: {
        zh: '个情节点',
        ja: 'プロットポイント',
        ko: '플롯 포인트',
        de: 'Plotpunkte',
        en: 'plot points'
      },
      stories: {
        zh: '个故事',
        ja: 'ストーリー',
        ko: '스토리',
        de: 'Geschichten',
        en: 'stories'
      }
    };
    return translations[key]?.[locale] || translations[key]?.['en'] || key;
  };

  const dateLocale = getDateLocale();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          {t('myPlots')}
          {plots.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {plots.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('recentPlots')}</span>
          <span className="text-xs text-muted-foreground font-normal">
            {plots.length} / {MAX_PLOTS_LIMIT}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {plots.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground space-y-2">
            <BookOpen className="h-12 w-12 mx-auto opacity-20" />
            <p>{t('noPlots')}</p>
            <p className="text-xs">{t('createPlot')}</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {plots.map((plot) => (
              <DropdownMenuItem
                key={plot.id}
                className="cursor-pointer p-3 flex-col items-start gap-2 focus:bg-accent"
                onClick={() => handleLoadPlot(plot)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate mb-1">
                      {plot.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{plot.complexity}</span>
                      <span>•</span>
                      <span>
                        {plot.plotPointCount} {t('plotPoints')}
                      </span>
                      {plot.storyCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{plot.storyCount} {t('stories')}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(plot.createdAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => handleDeletePlot(e, plot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
