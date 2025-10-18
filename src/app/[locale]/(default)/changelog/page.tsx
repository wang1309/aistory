import Changelog from "@/components/blocks/changelog";
import { getChangelogPage } from "@/services/page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/changelog`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/changelog`;
  }

  return {
    title: t("changelog.title"),
    description: t("changelog.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getChangelogPage(locale);

  return <>{page.changelog && <Changelog changelog={page.changelog} />}</>;
}
