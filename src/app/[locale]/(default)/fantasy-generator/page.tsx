import FantasyGenerate from "@/components/blocks/fantasy-generate";
import ModuleToolsSection from "@/components/blocks/module-tools";
import CTA from "@/components/blocks/cta";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Load translations from JSON file
  const messages = await import(`@/i18n/pages/fantasy/${locale}.json`);
  const section = messages.default.hero_fantasy;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/fantasy-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/fantasy-generator`;
  }

  return {
    title: section.header.meta_title,
    description: section.header.meta_description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function FantasyGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Load translations for the fantasy page
  const messages = await import(`@/i18n/pages/fantasy/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.hero_fantasy;
  const cta = messages.default.cta;

  // Build URLs for breadcrumb structured data
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/fantasy-generator`;

  // Breadcrumb JSON-LD structured data for SEO
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": section.breadcrumb.home,
        "item": `${homeUrl}${locale === "en" ? "" : `/${locale}`}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": section.breadcrumb.current,
        "item": currentUrl
      }
    ]
  };

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Fantasy Story Generator */}
      <FantasyGenerate section={section} />
      {/* AI Writing tools module */}
      <ModuleToolsSection
        module="ai-write"
        title={t("ai_tools.section_title_hub")}
        description={t("ai_tools.section_description_hub")}
        excludeSlug="fantasy-generator"
      />
      {/* CTA Section */}
      <CTA section={cta} />
    </>
  );
}
