import AiHumanizer from "@/components/blocks/ai-humanizer";
import RelatedTools from "@/components/blocks/related-tools";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import { buildLanguageAlternates } from "@/lib/seo";
import type { AiHumanizerPage as AiHumanizerPageSection } from "@/types/blocks/ai-humanizer";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  const messages = await import(`@/i18n/pages/ai-humanizer/${locale}.json`);
  const section = messages.default.ai_humanizer as AiHumanizerPageSection;
  const metadata = section.metadata;
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";

  const canonicalUrl =
    locale === "en"
      ? `${webUrl}/ai-tools/ai-humanizer`
      : `${webUrl}/${locale}/ai-tools/ai-humanizer`;

  const ogImage = `${webUrl}/share.png`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/ai-tools/ai-humanizer"),
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

export default async function AiHumanizerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tAiTools = await getTranslations({ locale, namespace: "ai_tools" });

  const messages = await import(`@/i18n/pages/ai-humanizer/${locale}.json`);
  const section = messages.default.ai_humanizer as AiHumanizerPageSection;
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/ai-tools/ai-humanizer`;
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
            name: tAiTools("tools_hub_nav"),
            item: `${homePath}/ai-tools`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: section.ui?.breadcrumb_current ?? "AI Humanizer",
            item: currentUrl,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: section.ui?.title ?? "AI Humanizer",
        description: section.metadata.description,
        url: currentUrl,
        inLanguage: schemaLocale,
        applicationCategory: "WritingApplication",
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
      <AiHumanizer section={section} />
      {section.feature_intro && (
        <FeatureIntro section={section.feature_intro} accent="emerald" />
      )}
      {section.how_to_use && (
        <HowToUse section={section.how_to_use} accent="emerald" />
      )}
      {section.feature_benefits && (
        <Benefits section={section.feature_benefits} accent="emerald" />
      )}
      {section.feature_section && (
        <UseCases section={section.feature_section} accent="emerald" />
      )}
      {section.faq_section && (
        <FAQ section={section.faq_section} accent="emerald" />
      )}
      <RelatedTools
        currentSlug="ai-humanizer"
        relatedSlugs={[
          "paragraph-rewriter",
          "essay-extender",
          "story-summarizer",
          "literature-review-generator",
        ]}
        title={section.related_tools.title}
        description={section.related_tools.description}
        moreHref="/ai-tools"
        moreLabel={section.related_tools.more_label}
        accent="emerald"
      />
      {section.cta_section && (
        <CTA section={section.cta_section} accent="emerald" locale={locale} />
      )}
    </>
  );
}
