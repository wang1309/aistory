import AiWriteWorkbench from "@/components/ai-write/workbench";
import { buildWorkbenchInitialState } from "@/components/ai-write/workbench/_lib";
import { findStoryByUuidForUser } from "@/models/story";
import { getUserUuid } from "@/services/user";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildLanguageAlternates } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ai-write/editor`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-write/editor`;
  }

  return {
    title: "AI Write — Editor",
    description:
      locale === "zh"
        ? "在一个续写工作台中编辑故事、调用 Agnes 对话代理并持续完善正文。"
        : locale === "de"
        ? "Bearbeite deinen Text in einer Schreibwerkbank und lasse Agnes direkt weiterfuehren."
        : "Edit your draft in a writing workbench and continue it with Agnes in real time.",
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

  let story:
    | {
        uuid: string;
        title: string | null;
        content: string;
        word_count: number;
        settings: Record<string, unknown> | null;
        prompt?: string | null;
        status?: string | null;
      }
    | undefined;

  if (storyUuid) {
    const userUuid = await getUserUuid();
    if (userUuid) {
      story = await findStoryByUuidForUser(storyUuid, userUuid);
    }
  }

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
