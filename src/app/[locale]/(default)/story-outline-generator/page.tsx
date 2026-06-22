import StoryOutlineGenerate from "@/components/blocks/story-outline-generate";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import ModuleToolsSection from "@/components/blocks/module-tools";
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
  const messages = await import(`@/i18n/pages/story-outline-generate/${locale}.json`);
  const section = messages.default.story_outline_generate;
  const metadata = section.metadata;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/story-outline-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/story-outline-generator`;
  }

  const ogImage = `${process.env.NEXT_PUBLIC_WEB_URL}/share.png`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/story-outline-generator"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story",
      locale: OG_LOCALE_MAP[locale] ?? "en_US",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: metadata.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [ogImage],
    },
  };
}

export default async function StoryOutlineGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/story-outline-generate/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.story_outline_generate;

  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/story-outline-generator`;
  const homePath = `${homeUrl}${locale === "en" ? "" : `/${locale}`}`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: section.ui?.breadcrumb_home ?? "Home", item: homePath },
          { "@type": "ListItem", position: 2, name: section.ui?.breadcrumb_current ?? "Story Outline Generator", item: currentUrl },
        ],
      },
      {
        "@type": "WebApplication",
        name: section.ui?.title ?? "Story Outline Generator",
        description: section.metadata.description,
        url: currentUrl,
        inLanguage: locale,
        applicationCategory: "CreativeWritingApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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

      <StoryOutlineGenerate section={section} />
      {section.feature1 && <FeatureIntro section={section.feature1} accent="orange" />}
      {section.how_to_use && <HowToUse section={section.how_to_use} accent="orange" />}
      {section.feature2 && <Benefits section={section.feature2} accent="orange" />}
      {section.feature3 && <UseCases section={section.feature3} accent="orange" />}
      {section.faq && <FAQ section={section.faq} accent="orange" />}
      <ModuleToolsSection
        module="ai-write"
        title={t("ai_tools.section_title_hub")}
        description={t("ai_tools.section_description_hub")}
        excludeSlug="story-outline-generator"
        accent="orange"
      />
      {section.cta && <CTA section={section.cta} accent="orange" />}
    </>
  );
}
