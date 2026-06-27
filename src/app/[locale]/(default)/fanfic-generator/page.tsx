import TabbedFanficGenerate from "@/components/blocks/fanfic-generate/tabbed-fanfic-generate";
import FeatureIntro from "@/components/sections/feature-intro";
import Benefits from "@/components/sections/benefits";
import HowToUse from "@/components/sections/how-to-use";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import RelatedTools from "@/components/blocks/related-tools";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildLanguageAlternates } from "@/lib/seo";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

const FEATURE_ICON_MAP: Record<string, string> = {
  multi_tool: "mdi:auto-fix",
  work_library: "mdi:book-open-variant",
  free_online: "mdi:gift-outline",
  multilingual_pairing: "mdi:translate",
};

const FEATURE_HIGHLIGHT_KEYS = new Set(["multi_tool", "free_online"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const messages = await import(`@/i18n/pages/fanfic/${locale}.json`);
  const section = messages.default.hero_fanfic;
  const metadata = messages.default.metadata;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/fanfic-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/fanfic-generator`;
  }

  const ogImage = `${process.env.NEXT_PUBLIC_WEB_URL}/imgs/showcases/1.png`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/fanfic-generator"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story",
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

export default async function FanficGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/fanfic/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.hero_fanfic;
  const modern = section.modern;
  const featureData = modern?.fanfic_feature1;
  const whatSection = modern?.fanfic_what;
  const howToUseSection = modern?.how_to_use;
  const useCasesSection = modern?.use_cases;
  const faqSection = modern?.faq;
  const cta = messages.default.cta;

  const featureSection = featureData
    ? {
        ...featureData,
        items: featureData.features
          ? Object.entries(featureData.features).map(([key, value]: [string, any]) => ({
              icon: FEATURE_ICON_MAP[key],
              title: value.title,
              description: value.description,
              highlight: FEATURE_HIGHLIGHT_KEYS.has(key),
            }))
          : [],
        statistics: featureData.statistics
          ? [
              { value: featureData.statistics.works_count, label: featureData.statistics.works_label, icon: "mdi:trending-up" },
              { value: featureData.statistics.characters_count, label: featureData.statistics.characters_label, icon: "mdi:account-group" },
              { value: featureData.statistics.languages_count, label: featureData.statistics.languages_label, icon: "mdi:translate" },
              { value: featureData.statistics.stories_count, label: featureData.statistics.stories_label, icon: "mdi:sparkles" },
            ]
          : [],
      }
    : undefined;

  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/fanfic-generator`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: section.breadcrumb.home,
        item: `${homeUrl}${locale === "en" ? "" : `/${locale}`}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: section.breadcrumb.current,
        item: currentUrl,
      },
    ],
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AI Fanfic Generator",
    description:
      "Free AI-powered fanfiction generator that turns any fandom, character pairing, and plot prompt into a complete 300-3000 word fanfic in seconds.",
    url: currentUrl,
    applicationCategory: "CreativeWork",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "20+ preset fandoms and 120+ characters with custom source support",
      "Character pairing modes: romantic, gen, poly",
      "Plot types: canon, modern AU, school AU, fantasy AU, crossover",
      "Advanced controls: OOC level, length, perspective, rating",
      "Three AI writing models tuned for character fidelity or creative range",
      "12-language output with one-click PDF export",
    ],
  };

  const faqSchema =
    faqSection?.items?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqSection.items.map(
            (item: { title: string; description: string }) => ({
              "@type": "Question",
              name: item.title,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.description,
              },
            })
          ),
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

      <TabbedFanficGenerate section={section} />
      {whatSection && <FeatureIntro section={whatSection} accent="orange" />}
      {featureSection && <Benefits section={featureSection} accent="orange" />}
      {howToUseSection && <HowToUse section={howToUseSection} accent="orange" />}
      {useCasesSection && <UseCases section={useCasesSection} accent="orange" />}
      {faqSection && <FAQ section={faqSection} accent="orange" />}
      <RelatedTools
        currentSlug="fanfic-generator"
        limit={6}
        title={t("ai_tools.related_title")}
        description={t("ai_tools.section_description_hub")}
        moreHref="/ai-write-tool"
        moreLabel={t("ai_tools.related_more_label")}
        accent="orange"
      />
      <CTA section={cta} accent="orange" />
    </>
  );
}
