import { getTranslations } from "next-intl/server";
import moment from "moment";
import { Link } from "@/i18n/navigation";
import { getPublicStories } from "@/models/story";
import { getTagsForStory } from "@/models/storyTags";
import StoryLikeButton from "@/components/story/story-like-button";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ page?: string; tag?: string }>;
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
  await params; // eslint-disable-line @typescript-eslint/no-unused-vars
  const t = await getTranslations();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = resolvedSearchParams?.page
    ? parseInt(resolvedSearchParams.page, 10) || 1
    : 1;
  const pageSize = 18;

  const tagSlug = resolvedSearchParams?.tag
    ? String(resolvedSearchParams.tag)
    : undefined;

  const { items, total } = await getPublicStories({
    page,
    limit: pageSize,
    tagSlug,
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
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
          {t("community.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {t("community.description")}
        </p>
        {tagSlug && currentTagLabel && (
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>
              {t("community.filtering_by_tag", { tag: currentTagLabel })}
            </span>
            <Link
              href="/community" as={"/community" as any}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] hover:bg-accent hover:text-foreground"
            >
              {t("community.clear_tag_filter")}
            </Link>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {t("community.no_stories")}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((story: Awaited<ReturnType<typeof getPublicStories>>["items"][number]) => {
            const createdAt = story.created_at
              ? moment(story.created_at).format("YYYY-MM-DD")
              : "";
            const excerpt = story.content.slice(0, 160);

            const storyTags =
              tagsByStoryUuid.get(story.uuid) ?? ([] as Awaited<
                ReturnType<typeof getTagsForStory>
              >);

            return (
              <div
                key={story.uuid}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background/60 transition-colors hover:bg-accent/40"
              >
                <Link
                  href={`/story/${story.uuid}` as any}
                  className="flex flex-1 flex-col gap-3 p-4 md:p-5"
                >
                  <h2 className="text-base font-semibold md:text-lg line-clamp-2">
                    {story.title || t("my_stories.table.untitled")}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>
                        {t("community.word_count", { words: story.word_count })}
                      </span>
                      <StoryLikeButton storyUuid={story.uuid} size="sm" />
                    </div>
                    {createdAt && (
                      <span>
                        {t("community.created_at", { date: createdAt })}
                      </span>
                    )}
                  </div>
                </Link>
                {storyTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-muted/40 px-4 py-2.5 md:px-5">
                    {storyTags.slice(0, 3).map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/community?tag=${encodeURIComponent(
                          tag.slug
                        )}` as any}
                        className="inline-flex items-center rounded-full border border-border bg-background/80 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                    {storyTags.length > 3 && (
                      <span className="text-[11px] text-muted-foreground">
                        +{storyTags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4 text-sm">
          {page > 1 && (
            <Link
              href={
                page > 2 ? (`/community?page=${page - 1}` as any) : ("/community" as any)
              }
              className="rounded-md border px-3 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {t("community.prev_page")}
            </Link>
          )}

          <span className="text-xs text-muted-foreground">
            {t("community.page_info", { page, totalPages })}
          </span>

          {page < totalPages && (
            <Link
              href={`/community?page=${page + 1}` as any}
              className="rounded-md border px-3 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {t("community.next_page")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
