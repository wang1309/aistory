import { getStoriesByUser } from "@/models/story";
import { getUserUuid } from "@/services/user";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import TableSlot from "@/components/console/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { TableColumn } from "@/types/blocks/table";
import moment from "moment";
import { Link } from "@/i18n/navigation";
import StoryStatusSelect from "@/components/console/story-status-select";
import StoryRowActions from "@/components/console/story-row-actions";

interface PageProps {
  searchParams?: Promise<{ page?: string }>;
}

export default async function MyStoriesPage({ searchParams }: PageProps) {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-stories`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = resolvedSearchParams?.page
    ? parseInt(resolvedSearchParams.page, 10) || 1
    : 1;
  const pageSize = 20;

  const { items, total } = await getStoriesByUser({
    user_uuid,
    page,
    limit: pageSize,
  });

  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

  const columns: TableColumn[] = [
    {
      name: "title",
      title: t("my_stories.table.title"),
      callback: (item: any) => (
        <Link
          href={`/my-stories/${item.uuid}` as any}
          className="text-primary hover:underline"
        >
          {item.title || t("my_stories.table.untitled")}
        </Link>
      ),
    },
    {
      name: "word_count",
      title: t("my_stories.table.word_count"),
    },
    {
      name: "status",
      title: t("my_stories.table.status"),
      callback: (item: any) => (
        <StoryStatusSelect uuid={item.uuid} initialStatus={item.status} />
      ),
    },
    {
      name: "created_at",
      title: t("my_stories.table.created_at"),
      callback: (item: any) =>
        item.created_at ? moment(item.created_at).format("YYYY-MM-DD HH:mm:ss") : "-",
    },
    {
      name: "actions",
      title: "",
      className: "text-right w-0",
      callback: (item: any) => (
        <StoryRowActions
          uuid={item.uuid}
          title={item.title || ""}
          untitledLabel={t("my_stories.table.untitled")}
        />
      ),
    },
  ];

  const table: TableSlotType = {
    title: t("my_stories.title"),
    description: t("my_stories.description"),
    columns,
    data: items,
    empty_message: t("my_stories.no_stories"),
    passby: {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        basePath: "/my-stories",
      },
    },
  };

  return <TableSlot {...table} />;
}
