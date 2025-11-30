import { findStoryByUuidForUser } from "@/models/story";
import { getUserUuid } from "@/services/user";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import moment from "moment";
import { Link } from "@/i18n/navigation";
import StoryTitleEditor from "@/components/console/story-title-editor";
import StoryDeleteButton from "@/components/console/story-delete-button";
import StoryTagsEditor from "@/components/story/story-tags-editor";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function MyStoryDetailPage({ params }: PageProps) {
  const { uuid } = await params;

  const user_uuid = await getUserUuid();
  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-stories/${uuid}`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const story = await findStoryByUuidForUser(uuid, user_uuid);
  if (!story) {
    notFound();
  }

  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <StoryTitleEditor
            uuid={uuid}
            initialTitle={story.title || ""}
            untitledLabel={t("my_stories.table.untitled")}
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {t("my_stories.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StoryDeleteButton uuid={uuid} />
          <Link
            href="/my-stories"
            className="text-sm text-primary hover:underline whitespace-nowrap"
          >
            {t("my_stories.back_to_list")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide">
            {t("my_stories.table.word_count")}
          </div>
          <div className="mt-1 font-medium text-foreground">
            {story.word_count}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide">
            {t("my_stories.table.status")}
          </div>
          <div className="mt-1 font-medium text-foreground">
            {story.status}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide">
            {t("my_stories.table.created_at")}
          </div>
          <div className="mt-1 font-medium text-foreground">
            {story.created_at
              ? moment(story.created_at).format("YYYY-MM-DD HH:mm:ss")
              : "-"}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide">Model</div>
          <div className="mt-1 font-medium text-foreground">
            {story.model_used || "-"}
          </div>
        </div>
      </div>

      <StoryTagsEditor storyUuid={uuid} />

      <div className="rounded-lg border bg-background p-4 md:p-6">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {story.content}
        </pre>
      </div>
    </div>
  );
}
