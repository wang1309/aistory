import ModuleToolsSection from "@/components/blocks/module-tools";
import { getToolsByModule } from "@/services/tools";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { buildLanguageAlternates } from "@/lib/seo";

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

  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ai-write`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-write`;
  }

  return {
    title: t("ai_tools.section_title_hub"),
    description: t("ai_tools.section_description_hub"),
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/ai-write"),
    },
  };
}

export default async function AiWritePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();
  const tools = getToolsByModule("ai-write");

  const webUrl =
    process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const baseUrl = locale === "en" ? webUrl : `${webUrl}/${locale}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("ai_tools.section_title_hub"),
    description: t("ai_tools.section_description_hub"),
    itemListElement: tools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}${tool.href}`,
      name: t(tool.nameKey),
      description: t(tool.shortDescKey),
      additionalType: "https://schema.org/SoftwareApplication",
      applicationCategory: "CreativeWritingApplication",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <ModuleToolsSection
        module="ai-write"
        title={t("ai_tools.section_title_hub")}
        description={t("ai_tools.section_description_hub")}
        headingLevel="h1"
      />
    </>
  );
}
