import ParagraphRewriter from "@/components/blocks/paragraph-rewriter";
import RelatedTools from "@/components/blocks/related-tools";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import { buildLanguageAlternates } from "@/lib/seo";
import type { ParagraphRewriterPage } from "@/types/blocks/paragraph-rewriter";
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
  const messages = await import(`@/i18n/pages/paragraph-rewriter/${locale}.json`);
  const section = messages.default.paragraph_rewriter as ParagraphRewriterPage;
  const metadata = section.metadata;
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";

  const canonicalUrl =
    locale === "en"
      ? `${webUrl}/paragraph-rewriter`
      : `${webUrl}/${locale}/paragraph-rewriter`;

  const ogImage = `${webUrl}/share.png`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/paragraph-rewriter"),
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

export default async function ParagraphRewriterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/paragraph-rewriter/${locale}.json`);
  const section = messages.default.paragraph_rewriter as ParagraphRewriterPage;
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/paragraph-rewriter`;
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
            name: section.ui?.breadcrumb_current ?? "Paragraph Rewriter",
            item: currentUrl,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: section.ui?.title ?? "Paragraph Rewriter",
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
      <ParagraphRewriter section={section} />
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
        currentSlug="paragraph-rewriter"
        relatedSlugs={[
          "essay-extender",
          "story-summarizer",
          "literature-review-generator",
          "story-outline-generator",
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
