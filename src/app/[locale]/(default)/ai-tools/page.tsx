import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildLanguageAlternates } from "@/lib/seo";
import ModuleToolsSection from "@/components/blocks/module-tools";
import { getAllTools } from "@/services/tools";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  // force-static 下 requestLocale 回落 defaultLocale,需显式传 locale 才能拿到正确语言的 messages
  const t = await getTranslations({ locale });

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ai-tools`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-tools`;
  }

  return {
    title: t("ai_tools.tools_hub_title"),
    description: t("ai_tools.tools_hub_description"),
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/ai-tools"),
    },
  };
}

export default async function AiToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const webUrl =
    process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const baseUrl = locale === "en" ? webUrl : `${webUrl}/${locale}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("ai_tools.tools_hub_title"),
    description: t("ai_tools.tools_hub_description"),
    url: `${baseUrl}/ai-tools`,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: "AI Story Generator",
      url: webUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: getAllTools().map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}${tool.href}`,
        name: t(tool.nameKey),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      {/* All Tools hub:聚合全站工具(ai-tools + ai-write)到单一列表,粗粒度三组筛选 */}
      <ModuleToolsSection
        module="all"
        label={t("ai_tools.tools_hub_nav")}
        title={t("ai_tools.tools_hub_title")}
        description={t("ai_tools.tools_hub_description")}
        accent="orange"
        groupedChips
        locale={locale}
      />
    </>
  );
}
