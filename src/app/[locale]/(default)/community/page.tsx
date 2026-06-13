import { getTranslations } from "next-intl/server";
import { getPublicStories } from "@/models/story";
import { getTagsForStory } from "@/models/storyTags";
import { buildLanguageAlternates } from "@/lib/seo";
import CommunityGrid from "@/components/community/community-grid";
import type { CommunityStory } from "@/components/community/story-card";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ page?: string; tag?: string; sourceCategory?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/community`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/community`;
  }

  return {
    title: t("community.title"),
    description: t("community.description"),
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/community"),
    },
  };
}

export default async function CommunityPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const t = await getTranslations();

  const previewLabel =
    locale === "zh"
      ? "预览"
      : locale === "ja"
      ? "プレビュー"
      : locale === "ko"
      ? "미리보기"
      : locale === "de"
      ? "Vorschau"
      : "Preview";

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = resolvedSearchParams?.page
    ? parseInt(resolvedSearchParams.page, 10) || 1
    : 1;
  const pageSize = 18;

  const tagSlug = resolvedSearchParams?.tag
    ? String(resolvedSearchParams.tag)
    : undefined;

  const sourceCategory = resolvedSearchParams?.sourceCategory
    ? String(resolvedSearchParams.sourceCategory)
    : undefined;

  const { items, total } = await getPublicStories({
    page,
    limit: pageSize,
    tagSlug,
    sourceCategory,
  });

  const stories: CommunityStory[] = [];

  let currentTagLabel: string | null = null;

  if (items.length > 0) {
    const rows = await Promise.all(
      items.map(async (story) => {
        const tags = await getTagsForStory(story.uuid);
        return {
          storyUuid: story.uuid,
          tags,
        };
      })
    );

    for (const row of rows) {
      if (tagSlug && !currentTagLabel) {
        const matched = row.tags.find((tag) => tag.slug === tagSlug);
        if (matched) {
          currentTagLabel = matched.name || tagSlug;
        }
      }
    }

    for (const story of items) {
      const matched = rows.find((row) => row.storyUuid === story.uuid);
      stories.push({
        uuid: story.uuid,
        title: story.title,
        content: story.content,
        word_count: story.word_count,
        created_at: story.created_at,
        tags: (matched?.tags ?? []).map((tag) => ({
          id: String(tag.id),
          name: tag.name,
          slug: tag.slug,
        })),
      });
    }
  }

  if (tagSlug && !currentTagLabel) {
    currentTagLabel = tagSlug;
  }

  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

  const categoryOptions = [
    {
      key: "all",
      value: undefined as string | undefined,
      label:
        locale === "zh"
          ? "全部"
          : locale === "ja"
          ? "すべて"
          : locale === "ko"
          ? "전체"
          : locale === "de"
          ? "Alle"
          : "All",
    },
    {
      key: "story",
      value: "story",
      label:
        locale === "zh"
          ? "故事"
          : locale === "ja"
          ? "ストーリー"
          : locale === "ko"
          ? "스토리"
          : locale === "de"
          ? "Geschichte"
          : "Story",
    },
    {
      key: "fanfic",
      value: "fanfic",
      label:
        locale === "zh"
          ? "同人"
          : locale === "ja"
          ? "二次創作"
          : locale === "ko"
          ? "팬픽션"
          : locale === "de"
          ? "Fanfic"
          : "Fanfic",
    },
    {
      key: "plot",
      value: "plot",
      label:
        locale === "zh"
          ? "剧情"
          : locale === "ja"
          ? "プロット"
          : locale === "ko"
          ? "줄거리"
          : locale === "de"
          ? "Handlung"
          : "Plot",
    },
    {
      key: "poem",
      value: "poem",
      label:
        locale === "zh"
          ? "诗歌"
          : locale === "ja"
          ? "詩"
          : locale === "ko"
          ? "시"
          : locale === "de"
          ? "Gedicht"
          : "Poem",
    },
  ];

  return (
    <div className="container py-10 md:py-14 lg:py-20">
      <CommunityGrid
        stories={stories}
        categoryOptions={categoryOptions}
        activeCategory={sourceCategory}
        activeTag={tagSlug}
        activeTagLabel={currentTagLabel}
        emptyMessage={t("community.no_stories")}
        untitledLabel={t("my_stories.table.untitled")}
        previewLabel={previewLabel}
        filteringByTagLabel={t("community.filtering_by_tag", { tag: currentTagLabel || tagSlug || "" })}
        clearTagFilterLabel={t("community.clear_tag_filter")}
        pageInfoLabel={t("community.page_info")}
        prevPageLabel={t("community.prev_page")}
        nextPageLabel={t("community.next_page")}
        pagination={{ page, totalPages }}
      />
    </div>
  );
}
