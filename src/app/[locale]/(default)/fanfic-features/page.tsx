// Example page using FanficFeature1 component
import FanficFeature1 from "@/components/blocks/fanfic-feature1";
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

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/fanfic-features`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/fanfic-features`;
  }

  return {
    title: "AI 同人文生成器 - 产品特性",
    description: "了解更多关于AI同人文生成器的强大功能",
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function FanficFeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Load translations for the fanfic page
  const messages = await import(`@/i18n/pages/fanfic/${locale}.json`);
  const featureData = messages.default.hero_fanfic.modern?.fanfic_feature1;

  // Transform features object to array format expected by component
  const featureSection = featureData ? {
    ...featureData,
    features: featureData.features ? Object.entries(featureData.features).map(([key, value]: [string, any]) => ({
      icon: key === 'work_library' ? 'mdi:book-open-variant' :
            key === 'character_pairing' ? 'mdi:account-multiple' :
            key === 'plot_control' ? 'mdi:lightning-bolt' :
            key === 'ai_models' ? 'mdi:brain' : undefined,
      title: value.title,
      description: value.description,
      highlight: key === 'character_pairing' || key === 'ai_models',
    })) : [],
    statistics: featureData.statistics ? [
      { value: featureData.statistics.works_count, label: featureData.statistics.works_label, icon: 'mdi:trending-up' },
      { value: featureData.statistics.characters_count, label: featureData.statistics.characters_label, icon: 'mdi:account-group' },
      { value: featureData.statistics.stories_count, label: featureData.statistics.stories_label, icon: 'mdi:sparkles' },
      { value: featureData.statistics.users_count, label: featureData.statistics.users_label, icon: 'mdi:trending-up' },
    ] : [],
  } : undefined;

  return (
    <>
      {/* FanficFeature1 Component */}
      <FanficFeature1 section={featureSection} />
    </>
  );
}
