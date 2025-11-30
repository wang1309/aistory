import { Metadata } from "next";
import { notFound } from "next/navigation";
import moment from "moment";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { findPublicStoryByUuid } from "@/models/story";
import StoryLikeButton from "@/components/story/story-like-button";
import StoryComments from "@/components/story/story-comments";

interface PageProps {
  params: Promise<{ uuid: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string; locale: string }>;
}): Promise<Metadata> {
  const { uuid } = await params;
  const t = await getTranslations();

  const story = await findPublicStoryByUuid(uuid);
  if (!story) {
    return {
      title: t("community.title"),
    };
  }

  const title = story.title || t("my_stories.table.untitled");
  const description = story.content
    ? story.content.slice(0, 160).replace(/\s+/g, " ")
    : "";

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const canonicalUrl = `${webUrl}/story/${uuid}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
  };
}

export default async function PublicStoryPage({ params }: PageProps) {
  const { uuid, locale } = await params;
  const t = await getTranslations();

  const story = await findPublicStoryByUuid(uuid);
  if (!story) {
    notFound();
  }

  const createdAt = story.created_at
    ? moment(story.created_at).format("YYYY-MM-DD HH:mm:ss")
    : "";

  return (
    <div className="container py-10 md:py-12 lg:py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={"/community" as any}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {t("community.back_to_community")}
          </Link>
          <Link
            href={`/${locale}/#craft_story` as any}
            className="text-sm text-primary hover:underline"
          >
            {t("story_page.start_creating")}
          </Link>
        </div>

        <header className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
              {story.title || t("my_stories.table.untitled")}
            </h1>
            <StoryLikeButton storyUuid={story.uuid} />
          </div>
          <p className="text-sm text-muted-foreground">
            {createdAt && (
              <>
                {t("community.created_at", {
                  date: moment(story.created_at).format("YYYY-MM-DD"),
                })}
                {" · "}
              </>
            )}
            {t("community.word_count", { words: story.word_count })}
          </p>
        </header>

        <div className="rounded-lg border bg-background p-4 md:p-6">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {story.content}
          </pre>
        </div>

        <StoryComments storyUuid={story.uuid} />
      </div>
    </div>
  );
}
