import DndBackstoryGenerate from "@/components/blocks/dnd-backstory-generate";
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

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/dnd-backstory-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/dnd-backstory-generator`;
  }

  const messages = await import(`@/i18n/pages/dnd-backstory-generate/${locale}.json`);
  const section = messages.default.dnd_backstory_generate;
  const metadata = section.metadata;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/dnd-backstory-generator"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story",
      type: "website",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_WEB_URL}/story.png`,
          width: 1200,
          height: 630,
          alt: metadata.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [`${process.env.NEXT_PUBLIC_WEB_URL}/story.png`],
    },
  };
}

export default async function DndBackstoryGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/dnd-backstory-generate/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.dnd_backstory_generate;
  const ui = section.ui;
  const {
    feature_intro,
    how_to_use,
    feature_benefits,
    feature_section,
    faq_section,
    cta_section,
  } = section;

  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/dnd-backstory-generator`;

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
        name: ui.breadcrumb_current,
        item: currentUrl,
      },
    ],
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: ui.title,
    description: section.metadata.description,
    url: currentUrl,
    applicationCategory: "GameApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "D&D 5e and 5.5e backstory generation",
      "Playable character and NPC output structure",
      "Traits, ideals, bonds, flaws, and secrets",
      "Three actionable DM hooks in every output",
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

      <DndBackstoryGenerate section={section} />
      {feature_intro && <FeatureIntro section={feature_intro} accent="orange" />}
      {how_to_use && <HowToUse section={how_to_use} accent="orange" />}
      {feature_benefits && <Benefits section={feature_benefits} accent="orange" />}
      {feature_section && <UseCases section={feature_section} accent="orange" />}
      {faq_section && <FAQ section={faq_section} accent="orange" />}

      <RelatedTools
        currentSlug="dnd-backstory-generator"
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
