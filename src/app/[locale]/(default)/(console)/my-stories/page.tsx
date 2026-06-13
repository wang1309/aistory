import { getStoriesByUser } from "@/models/story";
import { getUserUuid } from "@/services/user";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import StoriesList from "@/components/console/stories-list";

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

  return (
    <StoriesList
      stories={items}
      title={t("my_stories.title")}
      description={t("my_stories.description")}
      emptyMessage={t("my_stories.no_stories")}
      untitledLabel={t("my_stories.table.untitled")}
      pagination={{
        page,
        pageSize,
        total,
        totalPages,
        basePath: "/my-stories",
      }}
    />
  );
}
