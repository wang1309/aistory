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

export function buildAiWriteHeaderNav(items: NavItem[] = []) {
  return items.flatMap((item) => {
    if (!item.title || !item.children?.length) {
      return [item];
    }

    if (!["AI Write", "AI 写作", "KI-Schreiben"].includes(item.title)) {
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
      children: item.children.map((child) => {
        if (child.url === "/ai-write") {
          return {
            ...child,
            url: "/ai-write-tool",
          };
        }

        return child;
      }),
      title:
        item.title === "AI 写作"
          ? "AI 写作工具"
          : item.title === "KI-Schreiben"
          ? "KI-Schreib-Tools"
          : "AI Write Tool",
    };

    return [directEntry, toolHub];
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
