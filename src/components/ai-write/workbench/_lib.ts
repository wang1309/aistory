import type { NavItem } from "@/types/blocks/base";

export function buildContinueRoute({
  storyUuid,
  source,
}: {
  storyUuid?: string;
  source?: string;
} = {}) {
  const params = new URLSearchParams();

  if (storyUuid) {
    params.set("story", storyUuid);
  }

  if (source) {
    params.set("source", source);
  }

  const query = params.toString();
  return query ? `/ai-write/editor?${query}` : "/ai-write/editor";
}

const AI_WRITE_TITLES = new Set([
  "AI Write",
  "AI 写作",
  "KI-Schreiben",
  "AI ライティング",
  "AI 글쓰기",
  "AI письмо",
]);

const TOOL_HUB_TITLE_BY_LOCALE_TITLE: Record<string, string> = {
  "AI 写作": "AI 写作工具",
  "KI-Schreiben": "KI-Schreib-Tools",
  "AI ライティング": "AI ライティングツール",
  "AI 글쓰기": "AI 글쓰기 도구",
  "AI письмо": "Инструменты AI письма",
};

export function buildAiWriteHeaderNav(items: NavItem[] = []) {
  return items.flatMap((item) => {
    if (!item.title) {
      return [item];
    }

    if (!AI_WRITE_TITLES.has(item.title)) {
      return [item];
    }

    const directEntry: NavItem = {
      title: item.title,
      url: "/ai-write",
      icon: item.icon,
      target: "_self",
    };

    const toolHub: NavItem = {
      ...item,
      icon: "RiMagicLine",
      url: "/ai-write-tool",
      children: [],
      title: TOOL_HUB_TITLE_BY_LOCALE_TITLE[item.title] ?? "AI Write Tool",
    };

    return [toolHub, directEntry];
  });
}

export function buildWorkbenchInitialState({
  story,
}: {
  story?: {
    uuid: string;
    title: string | null;
    content: string;
    word_count: number;
    settings: Record<string, unknown> | null;
  };
}) {
  if (story) {
    return {
      title: story.title || "",
      content: story.content,
      sourceLabel: "my-story" as const,
    };
  }

  return {
    title: "",
    content: "",
    sourceLabel: "blank" as const,
  };
}

export function shouldRestoreBlankDraft({
  hasHydrated,
  storyUuid,
  currentTitle,
  currentContent,
  currentInstruction,
  draft,
}: {
  hasHydrated: boolean;
  storyUuid?: string;
  currentTitle: string;
  currentContent: string;
  currentInstruction: string;
  draft?: {
    title?: string;
    content?: string;
    instruction?: string;
  } | null;
}) {
  if (!hasHydrated || !!storyUuid || !draft) {
    return false;
  }

  if (currentTitle.trim() || currentContent.trim() || currentInstruction.trim()) {
    return false;
  }

  return !!(draft.title || draft.content || draft.instruction);
}

export function shouldAutoScrollEditor({
  isStreaming,
  scrollTop,
  clientHeight,
  scrollHeight,
  threshold = 96,
}: {
  isStreaming: boolean;
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  threshold?: number;
}) {
  if (!isStreaming) {
    return false;
  }

  const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
  return distanceFromBottom <= threshold;
}

export function shouldOpenSignInForSave({
  hasUser,
  isManualSave,
}: {
  hasUser: boolean;
  isManualSave: boolean;
}) {
  return !hasUser && isManualSave;
}

export function createQueuedAsyncAction(action: () => Promise<void>) {
  let inFlight: Promise<void> | null = null;
  let rerunRequested = false;

  const run = async (): Promise<void> => {
    if (inFlight) {
      rerunRequested = true;
      return inFlight;
    }

    inFlight = (async () => {
      try {
        await action();
      } finally {
        inFlight = null;

        if (rerunRequested) {
          rerunRequested = false;
          await run();
        }
      }
    })();

    return inFlight;
  };

  return run;
}
