import StorySummarizer from "@/components/blocks/story-summarizer";
import RelatedTools from "@/components/blocks/related-tools";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import { buildLanguageAlternates } from "@/lib/seo";
import type { StorySummarizerPage } from "@/types/blocks/story-summarizer";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  zh: "zh_CN",
  de: "de_DE",
  ja: "ja_JP",
  ko: "ko_KR",
  ru: "ru_RU",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await import(`@/i18n/pages/story-summarizer/${locale}.json`);
  const section = messages.default.story_summarizer as StorySummarizerPage;
  const metadata = section.metadata;
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";

  const canonicalUrl =
    locale === "en"
      ? `${webUrl}/story-summarizer`
      : `${webUrl}/${locale}/story-summarizer`;

  const ogImage = `${webUrl}/share.png`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/story-summarizer"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story",
      locale: OG_LOCALE_MAP[locale] ?? "en_US",
      type: "website",
      images: [
        {
          url: ogImage,
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
      images: [ogImage],
    },
  };
}

export default async function StorySummarizerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/story-summarizer/${locale}.json`);
  const section = messages.default.story_summarizer as StorySummarizerPage;
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/story-summarizer`;
  const homePath = `${homeUrl}${locale === "en" ? "" : `/${locale}`}`;
  const schemaLocale = OG_LOCALE_MAP[locale]?.replace("_", "-") ?? "en-US";

  const graph: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: section.ui?.breadcrumb_home ?? "Home",
            item: homePath,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: section.ui?.breadcrumb_current ?? "Story Summarizer",
            item: currentUrl,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: section.ui?.title ?? "Story Summarizer",
        description: section.metadata.description,
        url: currentUrl,
        inLanguage: schemaLocale,
        applicationCategory: "CreativeWritingApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      ...(section.faq_section?.items?.length
        ? [
            {
              "@type": "FAQPage",
              inLanguage: schemaLocale,
              mainEntity: section.faq_section.items.map(
                (item: { title?: string; description?: string }) => ({
                  "@type": "Question",
                  name: item.title,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: item.description,
                  },
                })
              ),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <StorySummarizer section={section} />
      {section.feature_intro && (
        <FeatureIntro section={section.feature_intro} accent="amber" />
      )}
      {section.how_to_use && (
        <HowToUse section={section.how_to_use} accent="amber" />
      )}
      {section.feature_benefits && (
        <Benefits section={section.feature_benefits} accent="amber" />
      )}
      {section.feature_section && (
        <UseCases section={section.feature_section} accent="amber" />
      )}
      {section.faq_section && (
        <FAQ section={section.faq_section} accent="amber" />
      )}
      <RelatedTools
        currentSlug="story-summarizer"
        relatedSlugs={[
          "story-outline-generator",
          "plot-generator",
          "backstory-generator",
          "literature-review-generator",
        ]}
        title={section.related_tools.title}
        description={section.related_tools.description}
        moreHref="/ai-tools"
        moreLabel={section.related_tools.more_label}
        accent="amber"
      />
      {section.cta_section && (
        <CTA section={section.cta_section} accent="amber" locale={locale} />
      )}
    </>
  );
}
