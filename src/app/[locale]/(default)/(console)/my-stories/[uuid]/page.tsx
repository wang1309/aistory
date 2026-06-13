import { findStoryByUuidForUser } from "@/models/story";
import { getUserUuid } from "@/services/user";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import moment from "moment";
import { Link } from "@/i18n/navigation";
import StoryTitleEditor from "@/components/console/story-title-editor";
import StoryDeleteButton from "@/components/console/story-delete-button";
import StoryTagsEditor from "@/components/story/story-tags-editor";
import StoryStatusBadge from "@/components/console/story-status-badge";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

const anim = (delay: string) =>
  `fadeInUp 0.7s cubic-bezier(0.32,0.72,0,1) ${delay} both`;

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

  const meta = [
    {
      label: t("my_stories.table.word_count"),
      value: story.word_count?.toLocaleString() ?? "-",
      type: "text" as const,
    },
    {
      label: t("my_stories.table.status"),
      value: story.status,
      type: "status" as const,
    },
    {
      label: t("my_stories.table.created_at"),
      value: story.created_at
        ? moment(story.created_at).format("MMM D, YYYY · HH:mm")
        : "-",
      type: "text" as const,
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Bar */}
      <div
        style={{ animation: anim("0s") }}
        className="flex items-center justify-between gap-4"
      >
        <Link
          href="/my-stories"
          className="group inline-flex items-center gap-2 rounded-full border border-border/40 px-4 py-2 text-xs font-medium text-muted-foreground/70 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/70 hover:text-foreground"
        >
          <svg
            className="size-3.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          {t("my_stories.back_to_list")}
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={
              buildContinueRoute({
                storyUuid: uuid,
                source: "my-stories",
              }) as any
            }
            className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
          >
            AI Write
            <span className="flex size-5 items-center justify-center rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
              <svg
                className="size-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </span>
          </Link>
          <StoryDeleteButton uuid={uuid} />
        </div>
      </div>

      {/* Title */}
      <div style={{ animation: anim("0.08s") }}>
        <StoryTitleEditor
          uuid={uuid}
          initialTitle={story.title || ""}
          untitledLabel={t("my_stories.table.untitled")}
        />
      </div>

      {/* Metadata Bento Grid */}
      <div
        className="grid grid-cols-2 gap-2 md:grid-cols-4"
        style={{ animation: anim("0.14s") }}
      >
        {meta.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.25rem] border border-border/30 bg-black/[0.02] p-1 dark:bg-white/[0.02]"
          >
            <div className="rounded-[1rem] bg-card p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                {item.label}
              </div>
              {item.type === "status" ? (
                <div className="mt-2.5">
                  <StoryStatusBadge status={item.value} />
                </div>
              ) : (
                <div className="mt-2.5 text-sm font-semibold tracking-tight">
                  {item.value}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div style={{ animation: anim("0.2s") }}>
        <StoryTagsEditor storyUuid={uuid} />
      </div>

      {/* Content */}
      <div style={{ animation: anim("0.26s") }}>
        <div className="rounded-[1.5rem] border border-border/30 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
          <div className="rounded-[1.25rem] bg-card p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] md:p-10 lg:p-12">
            <div className="font-serif text-[15px] leading-[1.9] text-foreground/85 whitespace-pre-wrap">
              {story.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
