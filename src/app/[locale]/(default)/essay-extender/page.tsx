import EssayExtender from "@/components/blocks/essay-extender";
import RelatedTools from "@/components/blocks/related-tools";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import { buildLanguageAlternates } from "@/lib/seo";
import type { EssayExtenderPage } from "@/types/blocks/essay-extender";
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
  const messages = await import(`@/i18n/pages/essay-extender/${locale}.json`);
  const section = messages.default.essay_extender as EssayExtenderPage;
  const metadata = section.metadata;
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";

  const canonicalUrl =
    locale === "en"
      ? `${webUrl}/essay-extender`
      : `${webUrl}/${locale}/essay-extender`;

  const ogImage = `${webUrl}/share.png`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/essay-extender"),
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

export default async function EssayExtenderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/essay-extender/${locale}.json`);
  const section = messages.default.essay_extender as EssayExtenderPage;
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/essay-extender`;
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
            name: section.ui?.breadcrumb_current ?? "Essay Extender",
            item: currentUrl,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: section.ui?.title ?? "Essay Extender",
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
      <EssayExtender section={section} />
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
        currentSlug="essay-extender"
        relatedSlugs={[
          "literature-review-generator",
          "story-summarizer",
          "story-outline-generator",
          "plot-generator",
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
