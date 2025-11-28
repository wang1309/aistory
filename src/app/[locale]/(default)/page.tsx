import { Suspense } from "react";
import dynamic from "next/dynamic";
import Hero from "@/components/blocks/hero";
import StoryGenerate from "@/components/blocks/story-generate";
import StoryGuide from "@/components/onboarding/story-guide";
import { getLandingPage } from "@/services/page";
import { getTranslations, setRequestLocale } from "next-intl/server";

// Dynamic imports for non-critical components
const ModuleToolsSection = dynamic(() => import("@/components/blocks/module-tools"));
const Branding = dynamic(() => import("@/components/blocks/branding"));
const Feature1 = dynamic(() => import("@/components/blocks/feature1"));
const Feature2 = dynamic(() => import("@/components/blocks/feature2"));
const Feature3 = dynamic(() => import("@/components/blocks/feature3"));
const Feature = dynamic(() => import("@/components/blocks/feature"));
const Showcase = dynamic(() => import("@/components/blocks/showcase"));
const Stats = dynamic(() => import("@/components/blocks/stats"));
const Pricing = dynamic(() => import("@/components/blocks/pricing"));
const Testimonial = dynamic(() => import("@/components/blocks/testimonial"));
const FAQ = dynamic(() => import("@/components/blocks/faq"));
const CTA = dynamic(() => import("@/components/blocks/cta"));

// Loading placeholder component
function SectionSkeleton() {
  return <div className="w-full h-96 bg-muted/5 animate-pulse" />;
}

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
      {/* Critical: Always render immediately */}
      <StoryGuide />
      {page.hero && <Hero hero={page.hero} />}
      {page.story_generate && <StoryGenerate section={page.story_generate} />}

      {/* High Priority: Lazy load with Suspense */}
      <Suspense fallback={<SectionSkeleton />}>
        <ModuleToolsSection
          module="ai-write"
          title={t("ai_tools.section_title_home")}
          description={t("ai_tools.section_description_home")}
        />
      </Suspense>

      {/* Medium Priority: Lazy load below the fold */}
      <Suspense fallback={<SectionSkeleton />}>
        {page.branding && <Branding section={page.branding} />}
        {page.introduce && <Feature1 section={page.introduce} />}
        {page.benefit && <Feature2 section={page.benefit} />}
        {page.usage && <Feature3 section={page.usage} />}
      </Suspense>

      {/* Lower Priority: Lazy load further down */}
      <Suspense fallback={<SectionSkeleton />}>
        {page.feature && <Feature section={page.feature} />}
        {page.story_showcase && <Showcase section={page.story_showcase} />}
        {page.showcase && <Showcase section={page.showcase} />}
        {page.stats && <Stats section={page.stats} />}
      </Suspense>

      {/* Lowest Priority: Lazy load at the bottom */}
      <Suspense fallback={<SectionSkeleton />}>
        {page.pricing && <Pricing pricing={page.pricing} />}
        {page.testimonial && <Testimonial section={page.testimonial} />}
        {page.faq && <FAQ section={page.faq} />}
        {page.cta && <CTA section={page.cta} />}
      </Suspense>
    </>
  );
}
