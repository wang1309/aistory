import YoutubeTitleGenerate from "@/components/blocks/youtube-title-generate";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import RelatedTools from "@/components/blocks/related-tools";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildLanguageAlternates } from "@/lib/seo";

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
  const messages = await import(`@/i18n/pages/youtube-title-generate/${locale}.json`);
  const section = messages.default.youtube_title_generate;
  const metadata = section.metadata;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/youtube-title-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/youtube-title-generator`;
  }

  const ogImage = `${process.env.NEXT_PUBLIC_WEB_URL}/story.png`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/youtube-title-generator"),
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

export default async function YoutubeTitleGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/youtube-title-generate/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.youtube_title_generate;

  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/youtube-title-generator`;
  const homePath = `${homeUrl}${locale === "en" ? "" : `/${locale}`}`;

  const featureList = [
    section.feature1?.items?.[0]?.title,
    section.feature1?.items?.[1]?.title,
    section.feature2?.items?.[0]?.title,
    section.feature2?.items?.[1]?.title,
    section.feature3?.items?.[0]?.title,
  ].filter((v): v is string => Boolean(v));

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
            name: section.ui?.breadcrumb_current ?? "YouTube Title Generator",
            item: currentUrl,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: section.ui?.title ?? "YouTube Title Generator",
        description: section.metadata.description,
        url: currentUrl,
        inLanguage: locale,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        ...(featureList.length ? { featureList } : {}),
      },
      ...(section.faq?.items?.length
        ? [
            {
              "@type": "FAQPage",
              inLanguage: locale,
              mainEntity: section.faq.items.map(
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

      <YoutubeTitleGenerate section={section} />
      {section.feature1 && <FeatureIntro section={section.feature1} accent="orange" />}
      {section.how_to_use && <HowToUse section={section.how_to_use} accent="orange" />}
      {section.feature2 && <Benefits section={section.feature2} accent="orange" />}
      {section.feature3 && <UseCases section={section.feature3} accent="orange" />}
      {section.faq && <FAQ section={section.faq} accent="orange" />}
      <RelatedTools
        currentSlug="youtube-title-generator"
        limit={6}
        title={t("ai_tools.related_title")}
        description={t("ai_tools.section_description_hub")}
        moreHref="/ai-write-tool"
        moreLabel={t("ai_tools.related_more_label")}
        accent="orange"
      />
      {section.cta && <CTA section={section.cta} accent="orange" />}
    </>
  );
}
