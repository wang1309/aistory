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
import { StoryStorage, SavedStory, MAX_STORIES_LIMIT } from "@/lib/story-storage";
import { Clock, Trash2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS, ja, ko, de } from "date-fns/locale";

interface Props {
  onLoadStory: (story: SavedStory) => void;
  locale: string;
}

export default function StoryHistoryDropdown({ onLoadStory, locale }: Props) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [open, setOpen] = useState(false);

  // 加载故事列表
  const loadStories = () => {
    const loadedStories = StoryStorage.getStories();
    setStories(loadedStories);
  };

  // 当下拉菜单打开时加载数据
  useEffect(() => {
    if (open) {
      loadStories();
    }
  }, [open]);

  // 加载故事
  const handleLoadStory = (story: SavedStory) => {
    onLoadStory(story);
    setOpen(false);
  };

  // 删除故事
  const handleDeleteStory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    StoryStorage.deleteStory(id);
    loadStories();
  };

  // 获取date-fns的locale
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

  // 获取翻译文本
  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      myStories: {
        zh: '我的故事',
        ja: 'マイストーリー',
        ko: '내 스토리',
        de: 'Meine Geschichten',
        en: 'My Stories'
      },
      recentStories: {
        zh: '最近的故事',
        ja: '最近のストーリー',
        ko: '최근 스토리',
        de: 'Letzte Geschichten',
        en: 'Recent Stories'
      },
      noStories: {
        zh: '还没有保存的故事',
        ja: 'まだストーリーがありません',
        ko: '아직 저장된 스토리가 없습니다',
        de: 'Noch keine Geschichten gespeichert',
        en: 'No saved stories yet'
      },
      words: {
        zh: '字',
        ja: '語',
        ko: '단어',
        de: 'Wörter',
        en: 'words'
      }
    };
    return translations[key]?.[locale] || translations[key]?.['en'] || '';
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t('myStories')}
          </span>
          {stories.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs">
              {stories.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[90vw]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('recentStories')}</span>
          <span className="text-xs text-muted-foreground">
            ({stories.length}/{MAX_STORIES_LIMIT})
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {stories.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p>{t('noStories')}</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {stories.map((story) => (
              <DropdownMenuItem
                key={story.id}
                className="flex flex-col items-start gap-1.5 p-3 cursor-pointer focus:bg-accent"
                onClick={() => handleLoadStory(story)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* 标题 */}
                    <div className="font-medium truncate text-sm leading-tight">
                      {story.title}
                    </div>

                    {/* 元信息 */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span>
                        {story.wordCount} {t('words')}
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="truncate">{story.model}</span>
                    </div>

                    {/* 时间 */}
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(story.createdAt), {
                        addSuffix: true,
                        locale: getDateLocale()
                      })}
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-destructive/10 shrink-0"
                    onClick={(e) => handleDeleteStory(e, story.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    <span className="sr-only">Delete</span>
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
