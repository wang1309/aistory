import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { getLandingPage } from "@/services/page";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildLanguageAlternates } from "@/lib/seo";
import { ViewportLazy } from "@/components/viewport-lazy";
// Shared section components (same as comic-generator page)
import FeatureIntro from "@/components/sections/feature-intro";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import HowToUse from "@/components/sections/how-to-use";
import SectionFAQ from "@/components/sections/faq";
import SectionCTA from "@/components/sections/cta";

export const revalidate = 3600; // 1 hour
export const dynamic = "force-static";

// Dynamic imports for non-critical components
const StoryGenerate = nextDynamic(() => import("@/components/blocks/story-generate"), {
  loading: () => <StoryGenerateSkeleton />,
});
const ModuleToolsSection = nextDynamic(() => import("@/components/blocks/module-tools"));
const Branding = nextDynamic(() => import("@/components/blocks/branding"));
const Hero = nextDynamic(() => import("@/components/blocks/hero"), {
  loading: () => <HeroSkeleton />,
});
const StoryGuide = nextDynamic(() => import("@/components/onboarding/story-guide"));
const Showcase = nextDynamic(() => import("@/components/blocks/showcase"));
const Stats = nextDynamic(() => import("@/components/blocks/stats"));
const Pricing = nextDynamic(() => import("@/components/blocks/pricing"));
const Testimonial = nextDynamic(() => import("@/components/blocks/testimonial"));

// Loading placeholder components
function SectionSkeleton() {
  return <div className="w-full h-96 bg-muted/5 animate-pulse" />;
}

function HeroSkeleton() {
  return (
    <div className="min-h-[92vh] flex items-center justify-center">
      <div className="container px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-6">
        <div className="h-6 w-32 rounded-full bg-muted/10 animate-pulse" />
        <div className="h-16 w-3/4 max-w-3xl rounded-2xl bg-muted/10 animate-pulse" />
        <div className="h-6 w-1/2 max-w-xl rounded-lg bg-muted/10 animate-pulse" />
        <div className="flex gap-4 mt-4">
          <div className="h-16 w-40 rounded-full bg-muted/10 animate-pulse" />
          <div className="h-16 w-40 rounded-full bg-muted/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function CardGridSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div className="w-full py-20 sm:py-24">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center space-y-4 mb-14">
          <div className="h-5 w-24 rounded-full bg-muted/10 animate-pulse mx-auto" />
          <div className="h-8 w-64 rounded-lg bg-muted/10 animate-pulse mx-auto" />
          <div className="h-5 w-80 rounded-lg bg-muted/10 animate-pulse mx-auto" />
        </div>
        <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-${cols}`}>
          {Array.from({ length: cols * 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 bg-card p-6 space-y-4 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-muted/10" />
              <div className="h-5 w-2/3 rounded bg-muted/10" />
              <div className="h-4 w-full rounded bg-muted/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StoryGenerateSkeleton() {
  return <SectionSkeleton />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const canonicalUrl = locale === "en" ? webUrl : `${webUrl}/${locale}`;

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    keywords: t("metadata.keywords"),
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/"),
    },
    openGraph: {
      title: t("metadata.title"),
      description: t("metadata.description"),
      url: canonicalUrl,
      siteName: t("metadata.siteName"),
      type: "website",
      images: [
        {
          url: `${webUrl}/share.png`,
          width: 1200,
          height: 630,
          alt: t("metadata.title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.title"),
      description: t("metadata.description"),
    },
  };
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

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const currentUrl = locale === "en" ? webUrl : `${webUrl}/${locale}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: currentUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
            accent="orange"
          />
        </Suspense>
      </ViewportLazy>

      {/* Medium Priority: Shared section components (same as comic-generator) */}
      <ViewportLazy fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          {page.branding && <Branding section={page.branding} />}
          {page.introduce && <FeatureIntro section={page.introduce} accent="orange" />}
          {page.benefit && <Benefits section={page.benefit} accent="orange" />}
          {page.usage && <HowToUse section={page.usage} accent="orange" />}
        </Suspense>
      </ViewportLazy>

      {/* Lower Priority: Lazy load further down */}
      <ViewportLazy fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          {page.feature && <UseCases section={page.feature} accent="orange" />}
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
          {page.faq && <SectionFAQ section={page.faq} accent="orange" />}
          {page.cta && <SectionCTA section={page.cta} accent="orange" />}
        </Suspense>
      </ViewportLazy>
    </>
  );
}
