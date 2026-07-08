import AiWriteWorkbench from "@/components/ai-write/workbench";
import { buildWorkbenchInitialState } from "@/components/ai-write/workbench/_lib";
import { findStoryByUuidForUser } from "@/models/story";
import { getUserUuid } from "@/services/user";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildLanguageAlternates } from "@/lib/seo";
import { cache } from "react";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type EditorMetadata = {
  title: string;
  editor_label: string;
  description: string;
};

async function loadEditorMetadata(locale: string): Promise<EditorMetadata> {
  try {
    const messages = await import(
      `@/i18n/pages/ai-write-editor/${locale}.json`
    );
    return messages.default.ai_write_editor.metadata as EditorMetadata;
  } catch {
    const messages = await import(`@/i18n/pages/ai-write-editor/en.json`);
    return messages.default.ai_write_editor.metadata as EditorMetadata;
  }
}

// 用 React cache 让 generateMetadata 与 page 在同一请求里共享一次 story 查询，
// 避免元信息生成与渲染各查一次数据库。
const loadStoryForRequest = cache(
  async (
    storyUuid?: string
  ): Promise<Awaited<ReturnType<typeof findStoryByUuidForUser>>> => {
    if (!storyUuid) return undefined;
    const userUuid = await getUserUuid();
    if (!userUuid) return undefined;
    return findStoryByUuidForUser(storyUuid, userUuid);
  }
);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ story?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const story = await loadStoryForRequest(resolvedSearchParams?.story);

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ai-write/editor`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-write/editor`;
  }

  const messages = await loadEditorMetadata(locale);

  // 有 story 时把故事标题放进 title，方便用户在多个浏览器标签页之间区分；
  // 没有故事时退回到描述性的默认标题。
  const storyTitle = story?.title?.trim();
  const title = storyTitle
    ? `${storyTitle} — ${messages.editor_label}`
    : messages.title;

  return {
    title,
    description: messages.description,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/ai-write/editor"),
    },
    robots: { index: false },
  };
}

export default async function AiWriteEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ story?: string; source?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const storyUuid = resolvedSearchParams?.story;
  const source = resolvedSearchParams?.source;

  const story = await loadStoryForRequest(storyUuid);

  const initial = buildWorkbenchInitialState({ story });

  return (
    <AiWriteWorkbench
      initialStory={story}
      initialTitle={initial.title}
      initialContent={initial.content}
      source={source}
    />
  );
}
