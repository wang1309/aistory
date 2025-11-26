import Branding from "@/components/blocks/branding";
import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Hero from "@/components/blocks/hero";
import Pricing from "@/components/blocks/pricing";
import Showcase from "@/components/blocks/showcase";
import Stats from "@/components/blocks/stats";
import Testimonial from "@/components/blocks/testimonial";
import StoryGenerate from "@/components/blocks/story-generate";
import ModuleToolsSection from "@/components/blocks/module-tools";
import { getLandingPage } from "@/services/page";
import { getTranslations, setRequestLocale } from "next-intl/server";
import StoryGuide from "@/components/onboarding/story-guide";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getLandingPage(locale);
  const t = await getTranslations();

  return (
    <>
      <StoryGuide />
      {page.hero && <Hero hero={page.hero} />}
      {page.story_generate && <StoryGenerate section={page.story_generate} />}
      <ModuleToolsSection
        module="ai-write"
        title={t("ai_tools.section_title_home")}
        description={t("ai_tools.section_description_home")}
      />
      {page.branding && <Branding section={page.branding} />}
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.benefit && <Feature2 section={page.benefit} />}
      {page.usage && <Feature3 section={page.usage} />}
      {page.feature && <Feature section={page.feature} />}
      {page.story_showcase && <Showcase section={page.story_showcase} />}
      {page.showcase && <Showcase section={page.showcase} />}
      {page.stats && <Stats section={page.stats} />}
      {page.pricing && <Pricing pricing={page.pricing} />}
      {page.testimonial && <Testimonial section={page.testimonial} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
