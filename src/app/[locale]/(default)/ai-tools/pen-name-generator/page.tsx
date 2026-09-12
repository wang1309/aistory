import PenNameGenerator from "@/components/blocks/pen-name-generator";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import RelatedTools from "@/components/blocks/related-tools";
import { buildLanguageAlternates } from "@/lib/seo";
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
  const messages = await import(`@/i18n/pages/pen-name-generator/${locale}.json`);
  const section = messages.default.pen_name_generator;
  const metadata = section.metadata;

  const canonicalUrl =
    locale === "en"
      ? `${process.env.NEXT_PUBLIC_WEB_URL}/ai-tools/pen-name-generator`
      : `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-tools/pen-name-generator`;

  const ogImage = `${process.env.NEXT_PUBLIC_WEB_URL}/share.png`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/ai-tools/pen-name-generator"),
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
  };
}

export default async function PenNameGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tAiTools = await getTranslations({ locale, namespace: "ai_tools" });

  const messages = await import(`@/i18n/pages/pen-name-generator/${locale}.json`);
  const section = messages.default.pen_name_generator;
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/ai-tools/pen-name-generator`;
  const homePath = `${homeUrl}${locale === "en" ? "" : `/${locale}`}`;

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
            name: section.ui?.breadcrumb_current ?? "Pen Name Generator",
            item: currentUrl,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: section.ui?.title ?? "Pen Name Generator",
        description: section.metadata.description,
        url: currentUrl,
        inLanguage: locale,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
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
      <PenNameGenerator section={section} />
      {section.feature1 && <FeatureIntro section={section.feature1} accent="orange" />}
      {section.how_to_use && <HowToUse section={section.how_to_use} accent="orange" />}
      {section.feature2 && <Benefits section={section.feature2} accent="orange" />}
      {section.feature3 && <UseCases section={section.feature3} accent="orange" />}
      {section.faq && <FAQ section={section.faq} accent="orange" />}
      <RelatedTools
        currentSlug="pen-name-generator"
        relatedSlugs={[
          "book-title-generator",
          "story-outline-generator",
          "fantasy-generator",
          "backstory-generator",
        ]}
        title={section.related_tools.title}
        description={section.related_tools.description}
        moreHref="/ai-tools"
        moreLabel={section.related_tools.more_label}
        accent="orange"
      />
      {section.cta && <CTA section={section.cta} accent="orange" locale={locale} />}
    </>
  );
}
