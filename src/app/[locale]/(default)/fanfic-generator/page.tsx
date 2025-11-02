// Use the new tabbed layout (option card-style) instead of the original
import TabbedFanficGenerate from "@/components/blocks/fanfic-generate/tabbed-fanfic-generate";
import FanficFeature1 from "@/components/blocks/fanfic-feature1";
import FanficWhat from "@/components/blocks/fanfic-what";
import { FAQSimple01 } from "@/components/blocks/faq2";
import CTA from "@/components/blocks/cta";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Load translations from JSON file
  const messages = await import(`@/i18n/pages/fanfic/${locale}.json`);
  const section = messages.default.hero_fanfic;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/fanfic-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/fanfic-generator`;
  }

  return {
    title: section.header.meta_title,
    description: section.header.meta_description,
    alternates: {
      canonical: canonicalUrl,
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

  // Load translations for the fanfic page
  const messages = await import(`@/i18n/pages/fanfic/${locale}.json`);
  const section = messages.default.hero_fanfic;
  const featureData = messages.default.hero_fanfic.modern?.fanfic_feature1;
  const whatSection = messages.default.hero_fanfic.modern?.fanfic_what;
  const faqSection = messages.default.hero_fanfic.modern?.faq;
  const cta = messages.default.cta;

  // Transform features object to array format expected by component
  const featureSection = featureData ? {
    ...featureData,
    features: featureData.features ? Object.entries(featureData.features).map(([key, value]: [string, any]) => ({
      icon: key === 'multi_tool' ? 'mdi:auto-fix' :
            key === 'work_library' ? 'mdi:book-open-variant' :
            key === 'free_online' ? 'mdi:gift-outline' :
            key === 'multilingual_pairing' ? 'mdi:translate' : undefined,
      title: value.title,
      description: value.description,
      highlight: key === 'multi_tool' || key === 'free_online',
    })) : [],
    statistics: featureData.statistics ? [
      { value: featureData.statistics.works_count, label: featureData.statistics.works_label, icon: 'mdi:trending-up' },
      { value: featureData.statistics.characters_count, label: featureData.statistics.characters_label, icon: 'mdi:account-group' },
      { value: featureData.statistics.languages_count, label: featureData.statistics.languages_label, icon: 'mdi:translate' },
      { value: featureData.statistics.stories_count, label: featureData.statistics.stories_label, icon: 'mdi:sparkles' },
    ] : [],
  } : undefined;

  // Build URLs for breadcrumb structured data
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/fanfic-generator`;

  // Breadcrumb JSON-LD structured data for SEO
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": section.breadcrumb.home,
        "item": `${homeUrl}${locale === "en" ? "" : `/${locale}`}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": section.breadcrumb.current,
        "item": currentUrl
      }
    ]
  };

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* New tabbed layout with 5 steps and auto-advance */}
      <TabbedFanficGenerate section={section} />
      {/* What is Fanfic Generator Section */}
      <FanficWhat section={whatSection} />
      {/* Feature Highlights Section */}
      <FanficFeature1 section={featureSection} />
      {/* FAQ Section */}
      <FAQSimple01 section={faqSection} />
      {/* CTA Section */}
      <CTA section={cta} />
    </>
  );
}
