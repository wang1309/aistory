import HeroBooktitle from "@/components/blocks/hero-booktitle";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature from "@/components/blocks/feature";
import FAQ from "@/components/blocks/faq";
import CTA from "@/components/blocks/cta";
import { setRequestLocale } from "next-intl/server";
import ModuleToolsSection from "@/components/blocks/module-tools";
import { getTranslations } from "next-intl/server";
import { buildLanguageAlternates } from "@/lib/seo";

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
  const messages = await import(`@/i18n/pages/booktitle/${locale}.json`);
  const section = messages.default.hero_booktitle;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/book-title-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/book-title-generator`;
  }

  return {
    title: section.header.meta_title,
    description: section.header.meta_description,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/book-title-generator"),
    },
  };
}

export default async function BookTitlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Load translations for the booktitle page
  const messages = await import(`@/i18n/pages/booktitle/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.hero_booktitle;
  const featureIntro = messages.default.feature_intro;
  const featureBenefits = messages.default.feature_benefits;
  const featureUsecases = messages.default.feature_usecases;
  const faq = messages.default.faq;
  const cta = messages.default.cta;

  // Build URLs for breadcrumb structured data
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/book-title-generator`;

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
      <HeroBooktitle section={section} />
      <Feature1 section={featureIntro} />
      <Feature2 section={featureBenefits} />
      <Feature section={featureUsecases} />
      <FAQ section={faq} />
      <ModuleToolsSection
        module="ai-write"
        title={t("ai_tools.section_title_hub")}
        description={t("ai_tools.section_description_hub")}
        excludeSlug="book-title-generator"
      />
      <CTA section={cta} />
    </>
  );
}
