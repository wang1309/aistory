import { getTranslations } from "next-intl/server";
import moment from "moment";
import { Link } from "@/i18n/navigation";
import { getPublicStories } from "@/models/story";
import { getTagsForStory } from "@/models/storyTags";
import StoryLikeButton from "@/components/story/story-like-button";
import StoryPreviewButton from "@/components/community/story-preview-button";

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

  const tagsByStoryUuid = new Map<
    string,
    Awaited<ReturnType<typeof getTagsForStory>>
  >();

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
      tagsByStoryUuid.set(row.storyUuid, row.tags);

      if (tagSlug && !currentTagLabel) {
        const matched = row.tags.find((tag) => tag.slug === tagSlug);
        if (matched) {
          currentTagLabel = matched.name || tagSlug;
        }
      }
    }
  }

  if (tagSlug && !currentTagLabel) {
    currentTagLabel = tagSlug;
  }

  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

  return (
    <div className="container py-10 md:py-12 lg:py-16">
      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen dark:bg-indigo-500/5" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen dark:bg-purple-500/5" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Hero Section */}
      <div className="mb-16 text-center relative">
        <div className="inline-flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-2xl opacity-20 rounded-full" />
          <div className="relative bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl rounded-2xl p-4 transform hover:scale-105 transition-transform duration-500">
            <span className="text-4xl select-none">✨</span>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-indigo-400">
            {t("community.title")}
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto font-light leading-relaxed mb-8">
          {t("community.description")}
        </p>

        {tagSlug && currentTagLabel && (
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 backdrop-blur-sm">
            <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">
              {t("community.filtering_by_tag", { tag: currentTagLabel })}
            </span>
            <Link
              href="/community" as={"/community" as any}
              className="group flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500 hover:text-white transition-colors"
            >
              <span className="sr-only">{t("community.clear_tag_filter")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Source Category Filter */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
        {[
          {
            key: "all",
            value: undefined as string | undefined,
            label:
              locale === "zh"
                ? "全部来源"
                : "All sources",
          },
          {
            key: "story",
            value: "story",
            label:
              locale === "zh"
                ? "长篇/短篇故事"
                : "Story",
          },
          {
            key: "fanfic",
            value: "fanfic",
            label:
              locale === "zh"
                ? "同人故事"
                : "Fanfic",
          },
          {
            key: "plot",
            value: "plot",
            label:
              locale === "zh"
                ? "剧情大纲"
                : "Plot",
          },
          {
            key: "poem",
            value: "poem",
            label:
              locale === "zh"
                ? "诗歌"
                : "Poem",
          },
        ].map((option) => {
          const isActive = option.value === sourceCategory || (!option.value && !sourceCategory);

          const params = new URLSearchParams();
          if (tagSlug) {
            params.set("tag", tagSlug);
          }
          if (option.value) {
            params.set("sourceCategory", option.value);
          }

          const href = `/community${params.toString() ? `?${params.toString()}` : ""}` as any;

          return (
            <Link
              key={option.key}
              href={href}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white/70 dark:bg-white/5 text-muted-foreground border-black/5 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-2xl opacity-10 rounded-full" />
            <div className="relative bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg rounded-2xl p-6">
              <span className="text-5xl select-none">📚</span>
            </div>
          </div>
          <p className="text-lg text-muted-foreground/80 font-light">
            {t("community.no_stories")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map(
            (
              story: Awaited<ReturnType<typeof getPublicStories>>["items"][number]
            ) => {
              const createdAt = story.created_at
              ? moment(story.created_at).format("MMM D, YYYY")
              : "";
            const excerpt = story.content.slice(0, 140);

            const storyTags =
              tagsByStoryUuid.get(story.uuid) ??
              ([] as Awaited<ReturnType<typeof getTagsForStory>>);

            const wordCountLabel =
              locale === "zh"
                ? `${story.word_count} 字`
                : locale === "ja"
                ? `${story.word_count} 文字`
                : locale === "ko"
                ? `${story.word_count}자`
                : locale === "de"
                ? `${story.word_count} Wörter`
                : `${story.word_count} words`;

            const metaParts: string[] = [wordCountLabel];
            if (createdAt) {
              metaParts.push(createdAt);
            }
            const previewMeta = metaParts.join(" • ");

              return (
                <div
                  key={story.uuid}
                  className="group relative flex flex-col h-full rounded-[1.5rem] transition-all duration-300 hover:-translate-y-1.5"
                >
                  {/* Card Background Layer */}
                  <div className="absolute inset-0 rounded-[1.5rem] bg-white/60 dark:bg-white/5 shadow-lg shadow-indigo-500/5 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-indigo-500/10 group-hover:ring-indigo-500/20 dark:group-hover:ring-indigo-400/20" />

                  {/* Gradient Border Effect on Hover */}
                  <div className="absolute -inset-px rounded-[1.5rem] bg-gradient-to-b from-indigo-500/0 to-purple-500/0 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:from-indigo-500/10 group-hover:to-purple-500/10" />

                  {/* Content Container */}
                  <div className="relative flex flex-1 flex-col p-6 z-10">
                    <div className="flex flex-1 flex-col gap-4">
                      <Link
                        href={`/story/${story.uuid}` as any}
                        className="flex flex-col gap-4"
                      >
                        {/* Header: Title & Date */}
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 leading-snug">
                            {story.title || t("my_stories.table.untitled")}
                          </h2>
                          {createdAt && (
                            <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full whitespace-nowrap">
                              {createdAt}
                            </span>
                          )}
                        </div>

                        {/* Excerpt */}
                        <p className="text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed">
                          {excerpt}...
                        </p>
                      </Link>

                      {/* Tags */}
                      {storyTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2">
                          {storyTags.slice(0, 3).map((tag) => (
                            <Link
                              key={tag.id}
                              href={`/community?tag=${encodeURIComponent(tag.slug)}` as any}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-900/30 border border-indigo-100/80 dark:border-indigo-500/20 text-[10px] font-medium text-indigo-600/90 dark:text-indigo-300/90 transition-colors hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/60"
                            >
                              #{tag.name}
                            </Link>
                          ))}
                          {storyTags.length > 3 && (
                            <span className="text-[10px] font-medium text-muted-foreground/50 px-1">
                              +{storyTags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer: Stats & Actions */}
                    <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-60">
                          <path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.166a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                        </svg>
                        <span>{story.word_count}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StoryPreviewButton
                          title={story.title || t("my_stories.table.untitled")}
                          content={story.content}
                          meta={previewMeta}
                          label={previewLabel}
                        />
                        <div className="relative z-20">
                          <StoryLikeButton storyUuid={story.uuid} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-16 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={
                page > 2 ? (`/community?page=${page - 1}` as any) : ("/community" as any)
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 text-sm font-medium text-foreground/80 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
              {t("community.prev_page")}
            </Link>
          )}

          <div className="px-4 py-2 rounded-full bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-500/20">
            <span className="text-sm font-medium text-indigo-600/80 dark:text-indigo-300/80">
              {t("community.page_info", { page, totalPages })}
            </span>
          </div>

          {page < totalPages && (
            <Link
              href={`/community?page=${page + 1}` as any}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 text-sm font-medium text-foreground/80 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {t("community.next_page")}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
