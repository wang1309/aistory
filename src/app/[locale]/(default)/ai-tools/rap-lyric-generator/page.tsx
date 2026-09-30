import RapLyricGenerator from "@/components/blocks/rap-lyric-generator";
import RelatedTools from "@/components/blocks/related-tools";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import { buildLanguageAlternates } from "@/lib/seo";
import type { RapLyricGeneratorPage } from "@/types/blocks/rap-lyric-generator";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

const ROUTE = "/ai-tools/rap-lyric-generator";

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
  const messages = await import(`@/i18n/pages/rap-lyric-generator/${locale}.json`);
  const section = messages.default.rap_lyric_generator as RapLyricGeneratorPage;
  const metadata = section.metadata;
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";

  const canonicalUrl = locale === "en" ? `${webUrl}${ROUTE}` : `${webUrl}/${locale}${ROUTE}`;
  const ogImage = `${webUrl}/imgs/rap-lyric-generator/cover.webp`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates(ROUTE),
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
          width: 1280,
          height: 720,
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

export default async function RapLyricGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tAiTools = await getTranslations({ locale, namespace: "ai_tools" });

  const messages = await import(`@/i18n/pages/rap-lyric-generator/${locale}.json`);
  const section = messages.default.rap_lyric_generator as RapLyricGeneratorPage;
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}${ROUTE}`;
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
            name: section.ui?.breadcrumb_current ?? "Rap Lyric Generator",
            item: currentUrl,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: section.ui?.title ?? "AI Rap Lyric Generator",
        description: section.metadata.description,
        url: currentUrl,
        inLanguage: schemaLocale,
        applicationCategory: "MultimediaApplication",
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
      <RapLyricGenerator section={section} />
      {section.feature_intro && (
        <FeatureIntro section={section.feature_intro} accent="amber" />
      )}
      {section.how_to_use && <HowToUse section={section.how_to_use} accent="amber" />}
      {section.feature_benefits && (
        <Benefits section={section.feature_benefits} accent="amber" />
      )}
      {section.formats_section && (
        <UseCases section={section.formats_section} accent="amber" />
      )}
      {section.craft_section && <Benefits section={section.craft_section} accent="amber" />}
      {section.feature_section && (
        <UseCases section={section.feature_section} accent="amber" />
      )}
      {section.faq_section && <FAQ section={section.faq_section} accent="amber" />}
      <RelatedTools
        currentSlug="rap-lyric-generator"
        relatedSlugs={["poem-generator", "story-prompt-generator", "poem-title-generator"]}
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
