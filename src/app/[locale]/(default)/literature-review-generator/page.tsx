import LiteratureReviewGenerate from "@/components/blocks/literature-review-generate";
import FeatureIntro from "@/components/sections/feature-intro";
import LiteratureReviewExample from "@/components/sections/literature-review-example";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import HowToUse from "@/components/sections/how-to-use";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import RelatedTools from "@/components/blocks/related-tools";
import { getTranslations, setRequestLocale } from "next-intl/server";
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

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/literature-review-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/literature-review-generator`;
  }

  const messages = await import(`@/i18n/pages/literature-review-generate/${locale}.json`);
  const section = messages.default.literature_review_generate;
  const metadata = section.metadata;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/literature-review-generator"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
    },
  };
}

export default async function LiteratureReviewGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/literature-review-generate/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.literature_review_generate;
  const {
    feature_intro,
    example_section,
    how_to_use,
    source_responsibility,
    feature_section,
    faq_section,
    cta_section,
  } = section;

  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/literature-review-generator`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: section.ui.breadcrumb_current,
        item: currentUrl,
      },
    ],
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: section.ui.breadcrumb_current,
    description: section.metadata.description,
    url: currentUrl,
    applicationCategory: "EducationalApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Narrative literature review drafting",
      "Introduction, thematic synthesis, tensions and gaps structure",
      "Evidence-to-verify checklist instead of fabricated citations",
      "Undergraduate and Master's academic levels",
      "Adjustable review length and tone",
      "User-supplied sources treated as context only",
      "Multi-language output",
    ],
  };

  const faqSchema =
    faq_section?.items?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq_section.items.map((item: { title: string; description: string }) => ({
            "@type": "Question",
            name: item.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.description,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <LiteratureReviewGenerate section={section} />
      {feature_intro && <FeatureIntro section={feature_intro} accent="amber" />}
      {example_section && <LiteratureReviewExample section={example_section} />}
      {how_to_use && <HowToUse section={how_to_use} accent="amber" />}
      {source_responsibility && <Benefits section={source_responsibility} accent="amber" />}
      {feature_section && <UseCases section={feature_section} accent="amber" />}
      {faq_section && <FAQ section={faq_section} accent="amber" />}

      <RelatedTools
        currentSlug="literature-review-generator"
        limit={6}
        title={t("ai_tools.related_title")}
        description={t("ai_tools.section_description_hub")}
        moreHref="/ai-write-tool"
        moreLabel={t("ai_tools.related_more_label")}
        accent="amber"
      />

      {cta_section && <CTA section={cta_section} accent="amber" locale={locale} />}
    </>
  );
}
