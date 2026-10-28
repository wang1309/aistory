import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import GenreStoryGenerate from "@/components/blocks/genre-story-generate";
import HorrorStorySeoContent from "@/components/blocks/horror-story-seo-content";
import MysteryStorySeoContent from "@/components/blocks/mystery-story-seo-content";
import SciFiStorySeoContent from "@/components/blocks/sci-fi-story-seo-content";
import AdventureStorySeoContent from "@/components/blocks/adventure-story-seo-content";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import RelatedTools from "@/components/blocks/related-tools";
import { buildLanguageAlternates } from "@/lib/seo";
import {
  getGenreStoryGenerator,
  type GenreStoryKind,
} from "@/lib/genre-story-generators";
import type { GenreStoryGenerateSection } from "@/types/blocks/genre-story-generate";

const GENRE_PAGE_LOADERS: Record<
  GenreStoryKind,
  (locale: string) => Promise<{ default: unknown }>
> = {
  horror: (locale) =>
    import(`@/i18n/pages/horror-story-generate/${locale}.json`),
  mystery: (locale) =>
    import(`@/i18n/pages/mystery-story-generate/${locale}.json`),
  sci_fi: (locale) =>
    import(`@/i18n/pages/sci-fi-story-generate/${locale}.json`),
  adventure: (locale) =>
    import(`@/i18n/pages/adventure-story-generate/${locale}.json`),
};

async function loadGenrePage(slug: string, locale: string) {
  const generator = getGenreStoryGenerator(slug);
  if (!generator) {
    throw new Error(`Unknown genre story generator: ${slug}`);
  }

  const loaded = await GENRE_PAGE_LOADERS[generator.genre](locale);
  const sections = loaded.default as unknown as Record<
    string,
    GenreStoryGenerateSection
  >;
  const section = sections[generator.messageKey];
  if (!section) {
    throw new Error(
      `Missing ${generator.messageKey} in ${generator.i18nNamespace}/${locale}.json`
    );
  }

  return { generator, section };
}

function buildCanonicalUrl(href: string, locale: string): string {
  const base = (process.env.NEXT_PUBLIC_WEB_URL || "").replace(/\/$/, "");
  return `${base}${locale === "en" ? "" : `/${locale}`}${href}`;
}

export function createGenreStoryGeneratorMetadata(slug: string) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const { generator, section } = await loadGenrePage(slug, locale);
    const canonicalUrl = buildCanonicalUrl(generator.href, locale);
    const webUrl = (process.env.NEXT_PUBLIC_WEB_URL || "").replace(/\/$/, "");

    return {
      title: section.metadata.title,
      description: section.metadata.description,
      alternates: {
        canonical: canonicalUrl,
        languages: buildLanguageAlternates(generator.href),
      },
      openGraph: {
        title: section.metadata.title,
        description: section.metadata.description,
        url: canonicalUrl,
        siteName: "AI Story",
        type: "website",
        images: [
          {
            url: `${webUrl}/share.png`,
            width: 1200,
            height: 630,
            alt: section.metadata.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: section.metadata.title,
        description: section.metadata.description,
      },
    };
  };
}

export function createGenreStoryGeneratorPage(slug: string) {
  return async function GenreStoryGeneratorPage({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;
    setRequestLocale(locale);

    const { generator, section } = await loadGenrePage(slug, locale);
    const t = await getTranslations();
    const homeUrl = (process.env.NEXT_PUBLIC_WEB_URL || "").replace(/\/$/, "");
    const currentUrl = buildCanonicalUrl(generator.href, locale);

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: section.ui.breadcrumb_home,
          item: `${homeUrl}${locale === "en" ? "" : `/${locale}`}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: section.ui.breadcrumb_current,
          item: currentUrl,
        },
      ],
    };

    const webAppSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: section.ui.title,
      description: section.metadata.description,
      url: currentUrl,
      applicationCategory: "EntertainmentApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "AI story generator",
        "Multiple story lengths",
        "Genre-specific controls",
        "Multi-language output",
      ],
    };

    const faqSchema = section.faq_section?.items?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: section.faq_section.items.map((item) => ({
            "@type": "Question",
            name: item.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.description,
            },
          })),
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
        {faqSchema ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        ) : null}

        <GenreStoryGenerate generator={generator} section={section} />

        {generator.genre === "horror" && section.horror_seo ? (
          <HorrorStorySeoContent section={section.horror_seo} />
        ) : null}
        {generator.genre === "mystery" && section.mystery_seo ? (
          <MysteryStorySeoContent section={section.mystery_seo} />
        ) : null}
        {generator.genre === "sci_fi" && section.sci_fi_seo ? (
          <SciFiStorySeoContent section={section.sci_fi_seo} />
        ) : null}
        {generator.genre === "adventure" && section.adventure_seo ? (
          <AdventureStorySeoContent section={section.adventure_seo} />
        ) : null}

        {section.feature_intro ? (
          <FeatureIntro section={section.feature_intro} accent="orange" />
        ) : null}
        {section.how_to_use ? (
          <HowToUse section={section.how_to_use} accent="orange" />
        ) : null}
        {section.feature_benefits ? (
          <Benefits section={section.feature_benefits} accent="orange" />
        ) : null}
        {section.feature_section ? (
          <UseCases section={section.feature_section} accent="orange" />
        ) : null}
        {section.faq_section ? (
          <FAQ section={section.faq_section} accent="orange" />
        ) : null}

        <RelatedTools
          currentSlug={generator.slug}
          limit={6}
          title={t("ai_tools.related_title")}
          description={t("ai_tools.section_description_hub")}
          moreHref="/ai-write-tool"
          moreLabel={t("ai_tools.related_more_label")}
          accent="orange"
        />

        {section.cta_section ? (
          <CTA section={section.cta_section} accent="orange" />
        ) : null}
      </>
    );
  };
}
