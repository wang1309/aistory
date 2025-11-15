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
import { PoemStorage, MAX_POEMS_LIMIT } from "@/lib/poem-storage";
import type { PoemData } from "@/types/poem";
import { Clock, Trash2, FileText, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS, ja, ko, de } from "date-fns/locale";

interface Props {
  onLoadPoem: (poem: PoemData) => void;
  locale: string;
}

export default function PoemHistoryDropdown({ onLoadPoem, locale }: Props) {
  const [poems, setPoems] = useState<PoemData[]>([]);
  const [open, setOpen] = useState(false);

  // Load poems list
  const loadPoems = () => {
    const loadedPoems = PoemStorage.getPoems();
    setPoems(loadedPoems);
  };

  // Load data when dropdown opens
  useEffect(() => {
    if (open) {
      loadPoems();
    }
  }, [open]);

  // Load poem
  const handleLoadPoem = (poem: PoemData) => {
    onLoadPoem(poem);
    setOpen(false);
  };

  // Delete poem
  const handleDeletePoem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    PoemStorage.deletePoem(id);
    loadPoems();
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
      myPoems: {
        zh: '我的诗歌',
        ja: 'マイポエム',
        ko: '내 시',
        de: 'Meine Gedichte',
        en: 'My Poems'
      },
      recentPoems: {
        zh: '最近的诗歌',
        ja: '最近の詩',
        ko: '최근 시',
        de: 'Letzte Gedichte',
        en: 'Recent Poems'
      },
      noPoems: {
        zh: '还没有保存的诗歌',
        ja: '保存された詩はありません',
        ko: '저장된 시가 없습니다',
        de: 'Keine gespeicherten Gedichte',
        en: 'No saved poems yet'
      },
      createPoem: {
        zh: '创作一首诗歌来开始',
        ja: '詩を作成して始めましょう',
        ko: '시를 만들어 시작하세요',
        de: 'Erstellen Sie ein Gedicht, um zu beginnen',
        en: 'Create a poem to get started'
      },
      lines: {
        zh: '行',
        ja: '行',
        ko: '행',
        de: 'Zeilen',
        en: 'lines'
      },
      modern: {
        zh: '现代诗',
        ja: '現代詩',
        ko: '현대시',
        de: 'Modern',
        en: 'Modern'
      },
      classical: {
        zh: '古典诗',
        ja: '古典詩',
        ko: '고전시',
        de: 'Klassisch',
        en: 'Classical'
      },
      format: {
        zh: '特定格式',
        ja: 'フォーマット',
        ko: '정형시',
        de: 'Format',
        en: 'Format'
      },
      lyric: {
        zh: '歌词',
        ja: '歌詞',
        ko: '가사',
        de: 'Lyrik',
        en: 'Lyric'
      },
      short: {
        zh: '短',
        ja: '短',
        ko: '짧음',
        de: 'Kurz',
        en: 'Short'
      },
      medium: {
        zh: '中',
        ja: '中',
        ko: '중간',
        de: 'Mittel',
        en: 'Medium'
      },
      long: {
        zh: '长',
        ja: '長',
        ko: '김',
        de: 'Lang',
        en: 'Long'
      }
    };
    return translations[key]?.[locale] || translations[key]?.['en'] || key;
  };

  // Get preview text from poem content
  const getPreviewText = (content: string): string => {
    const firstLine = content.split('\n').filter(l => l.trim())[0] || '';
    return firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
  };

  // Calculate line count
  const calculateLineCount = (content: string): number => {
    return content.split('\n').filter(line => line.trim()).length;
  };

  const dateLocale = getDateLocale();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          {t('myPoems')}
          {poems.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {poems.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('recentPoems')}</span>
          <span className="text-xs text-muted-foreground font-normal">
            {poems.length} / {MAX_POEMS_LIMIT}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {poems.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground space-y-2">
            <BookOpen className="h-12 w-12 mx-auto opacity-20" />
            <p>{t('noPoems')}</p>
            <p className="text-xs">{t('createPoem')}</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {poems.map((poem) => (
              <DropdownMenuItem
                key={poem.id}
                className="cursor-pointer p-3 flex-col items-start gap-2 focus:bg-accent"
                onClick={() => handleLoadPoem(poem)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate mb-1">
                      {getPreviewText(poem.content)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t(poem.poemType)}</span>
                      <span>•</span>
                      <span>{t(poem.length)}</span>
                      {poem.rhymeScheme && (
                        <>
                          <span>•</span>
                          <span>{poem.rhymeScheme}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{calculateLineCount(poem.content)} {t('lines')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(poem.createdAt), {
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
                    onClick={(e) => handleDeletePoem(e, poem.id)}
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
