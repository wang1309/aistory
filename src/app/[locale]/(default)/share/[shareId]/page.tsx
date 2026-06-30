import { Metadata } from "next";
import { notFound } from "next/navigation";
import moment from "moment";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { findVisibleShareByShareId, incrShareView } from "@/models/story-share";
import ShareReportButton from "@/components/story/share-report-button";
import Markdown from "@/components/markdown";

interface PageProps {
  params: Promise<{ shareId: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string; locale: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const t = await getTranslations("share_page");

  const story = await findVisibleShareByShareId(shareId);

  // Public shares are explicitly noindex (UGC snapshots, not curated pages),
  // but follow:true so crawlers can still reach the CTA / main site.
  const robots = { index: false, follow: true };

  if (!story) {
    return { title: t("title"), robots };
  }

  const title = story.title || t("untitled");
  const description = story.content
    ? story.content.slice(0, 160).replace(/\s+/g, " ")
    : "";

  const webUrl =
    process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const canonicalUrl = `${webUrl}/share/${shareId}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
    robots,
  };
}

export default async function SharePage({ params }: PageProps) {
  const { shareId } = await params;
  const t = await getTranslations("share_page");

  const story = await findVisibleShareByShareId(shareId);
  if (!story) {
    notFound();
  }

  // Best-effort view counting; failure must not break rendering.
  incrShareView(shareId).catch(() => {});

  const createdAt = story.created_at
    ? moment(story.created_at).format("YYYY-MM-DD")
    : "";

  return (
    <div className="container py-10 md:py-12 lg:py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={"/ai-write" as any}
            className="text-sm text-primary hover:underline"
          >
            {t("start_creating")}
          </Link>
          <ShareReportButton
            shareId={story.share_id}
            labels={{
              report: t("report"),
              reported: t("reported"),
              title: t("report_title"),
              placeholder: t("report_placeholder"),
              submit: t("report_submit"),
              cancel: t("report_cancel"),
            }}
          />
        </div>

        <header className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
            {story.title || t("untitled")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {createdAt && <>{createdAt} · </>}
            {t("views", { count: story.view_count })}
          </p>

          {story.prompt && (
            <div className="rounded-lg border border-border/40 bg-black/[0.02] px-4 py-3 text-sm text-muted-foreground dark:bg-white/[0.02]">
              <span className="font-medium text-foreground">
                {t("prompt_label")}
              </span>{" "}
              {story.prompt}
            </div>
          )}
        </header>

        <div className="rounded-2xl border border-border/40 bg-black/[0.02] p-1.5 dark:bg-white/[0.02]">
          <div className="rounded-[1.125rem] border border-border/30 bg-card p-5 md:p-8">
            <Markdown content={story.content} />
          </div>
        </div>

        {/* CTA — funnel viewers back to the generator */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center md:p-8">
          <p className="text-lg font-semibold">{t("cta_title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("cta_desc")}
          </p>
          <Link
            href={"/ai-write" as any}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("cta_button")}
          </Link>
        </div>
      </div>
    </div>
  );
}
