import BedtimeStoryGenerate from "@/components/blocks/bedtime-story-generate";
import FeatureIntro from "@/components/sections/feature-intro";
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

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/bedtime-story-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/bedtime-story-generator`;
  }

  const messages = await import(`@/i18n/pages/bedtime-story-generate/${locale}.json`);
  const section = messages.default.bedtime_story_generate;
  const metadata = section.metadata;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/bedtime-story-generator"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story",
      type: "website",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_WEB_URL}/share.png`,
          width: 1200,
          height: 630,
          alt: "Bedtime Story Generator - Short Bedtime Stories for Kids",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
    },
  };
}

export default async function BedtimeStoryGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/bedtime-story-generate/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.bedtime_story_generate;
  const {
    feature_intro,
    how_to_use,
    feature_benefits,
    feature_section,
    faq_section,
    cta_section,
  } = section;

  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/bedtime-story-generator`;

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
    name: section.ui.title,
    description: section.metadata.description,
    url: currentUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Short bedtime stories for kids generated instantly",
      "5 minute bedtime stories with calming endings",
      "Quick bedtime stories personalized with child's name",
      "Age-appropriate bedtime stories for kids ages 2-12",
      "Multiple story themes, moral lessons, and lengths",
      "Multi-language support",
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

      <BedtimeStoryGenerate section={section} />
      {feature_intro && <FeatureIntro section={feature_intro} accent="orange" />}
      {how_to_use && <HowToUse section={how_to_use} accent="orange" />}
      {feature_benefits && <Benefits section={feature_benefits} accent="orange" />}
      {feature_section && <UseCases section={feature_section} accent="orange" />}
      {faq_section && <FAQ section={faq_section} accent="orange" />}

      <RelatedTools
        currentSlug="bedtime-story-generator"
        limit={6}
        title={t("ai_tools.related_title")}
        description={t("ai_tools.section_description_hub")}
        moreHref="/ai-write-tool"
        moreLabel={t("ai_tools.related_more_label")}
        accent="orange"
      />

      {cta_section && <CTA section={cta_section} accent="orange" />}
    </>
  );
}
