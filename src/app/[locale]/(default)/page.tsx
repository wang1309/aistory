import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { getLandingPage } from "@/services/page";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ViewportLazy } from "@/components/viewport-lazy";

export const revalidate = 3600; // 1 hour
export const dynamic = "force-static";

// Dynamic imports for non-critical components
const StoryGenerate = nextDynamic(() => import("@/components/blocks/story-generate"), {
  loading: () => <StoryGenerateSkeleton />,
});
const ModuleToolsSection = nextDynamic(() => import("@/components/blocks/module-tools"));
const Branding = nextDynamic(() => import("@/components/blocks/branding"));
const Feature1 = nextDynamic(() => import("@/components/blocks/feature1"));
const Feature2 = nextDynamic(() => import("@/components/blocks/feature2"));
const Feature3 = nextDynamic(() => import("@/components/blocks/feature3"));
const Hero = nextDynamic(() => import("@/components/blocks/hero"), {
  loading: () => <HeroSkeleton />,
});
const StoryGuide = nextDynamic(() => import("@/components/onboarding/story-guide"));
const Feature = nextDynamic(() => import("@/components/blocks/feature"));
const Showcase = nextDynamic(() => import("@/components/blocks/showcase"));
const Stats = nextDynamic(() => import("@/components/blocks/stats"));
const Pricing = nextDynamic(() => import("@/components/blocks/pricing"));
const Testimonial = nextDynamic(() => import("@/components/blocks/testimonial"));
const FAQ = nextDynamic(() => import("@/components/blocks/faq"));
const CTA = nextDynamic(() => import("@/components/blocks/cta"));

// Loading placeholder component
function SectionSkeleton() {
  return <div className="w-full h-96 bg-muted/5 animate-pulse" />;
}

function HeroSkeleton() {
  return <SectionSkeleton />;
}

function StoryGenerateSkeleton() {
  return <SectionSkeleton />;
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
      {page.story_generate && (
        <ViewportLazy fallback={<SectionSkeleton />}>
          <Suspense fallback={<SectionSkeleton />}>
            <StoryGenerate section={page.story_generate} />
          </Suspense>
        </ViewportLazy>
      )}

      {/* High Priority: Lazy load with Suspense + viewport gate */}
      <ViewportLazy fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <ModuleToolsSection
            module="ai-write"
            title={t("ai_tools.section_title_home")}
            description={t("ai_tools.section_description_home")}
          />
        </Suspense>
      </ViewportLazy>

      {/* Medium Priority: Lazy load below the fold */}
      <ViewportLazy fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          {page.branding && <Branding section={page.branding} />}
          {page.introduce && <Feature1 section={page.introduce} />}
          {page.benefit && <Feature2 section={page.benefit} />}
          {page.usage && <Feature3 section={page.usage} />}
        </Suspense>
      </ViewportLazy>

      {/* Lower Priority: Lazy load further down */}
      <ViewportLazy fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          {page.feature && <Feature section={page.feature} />}
          {page.story_showcase && <Showcase section={page.story_showcase} />}
          {page.showcase && <Showcase section={page.showcase} />}
          {page.stats && <Stats section={page.stats} />}
        </Suspense>
      </ViewportLazy>

      {/* Lowest Priority: Lazy load at the bottom */}
      <ViewportLazy fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          {page.pricing && <Pricing pricing={page.pricing} />}
          {page.testimonial && <Testimonial section={page.testimonial} />}
          {page.faq && <FAQ section={page.faq} />}
          {page.cta && <CTA section={page.cta} />}
        </Suspense>
      </ViewportLazy>
    </>
  );
}
