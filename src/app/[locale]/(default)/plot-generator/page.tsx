import PlotGenerate from "@/components/blocks/plot-generate";
import FeatureIntro from "@/components/sections/feature-intro";
import Benefits from "@/components/sections/benefits";
import HowToUse from "@/components/sections/how-to-use";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import ModuleToolsSection from "@/components/blocks/module-tools";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildLanguageAlternates } from "@/lib/seo";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/plot-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/plot-generator`;
  }

  // Load translations for metadata
  const messages = await import(`@/i18n/pages/plot-generate/${locale}.json`);
  const section = messages.default.plot_generate;
  const metadata = section.metadata;

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "";

  return {
    title: `${metadata.title} | StoriesGenerator`,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/plot-generator"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story",
      type: "website",
      images: [
        {
          url: `${baseUrl}/share.png`,
          width: 1200,
          height: 630,
          alt: "AI Plot Generator - Create Story Outlines",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [`${baseUrl}/share.png`],
    },
  };
}

export default async function PlotGeneratePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Load translations
  const messages = await import(`@/i18n/pages/plot-generate/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.plot_generate;
  const { feature_section, feature1_section, feature3_section, testimonial_section, faq_section, cta_section } = section;

  // Build URLs for breadcrumb structured data
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/plot-generator`;

  // Breadcrumb JSON-LD structured data for SEO
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": homeUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Plot Generator",
        "item": currentUrl,
      },
    ],
  };

  // WebApplication JSON-LD for the Plot Generator tool
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Plot Generator",
    "description": "AI-powered tool for generating detailed story outlines with characters, plot points, and narrative structure",
    "url": currentUrl,
    "applicationCategory": "CreativeWork",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "featureList": [
      "Character development",
      "Plot point generation",
      "Narrative arc structure",
      "Subplot creation",
      "Conflict mapping",
      "Multi-language support",
    ],
  };

  // FAQPage JSON-LD
  const faqSchema = faq_section ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq_section.items.map((item: { title: string; description: string }) => ({
      "@type": "Question",
      "name": item.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.description,
      },
    })),
  } : null;

  // HowTo JSON-LD
  const howToSchema = feature3_section ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": feature3_section.title,
    "description": feature3_section.description,
    "step": feature3_section.items.map((item: { title: string; description: string }, index: number) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": item.title,
      "text": item.description,
    })),
  } : null;

  return (
    <>
      {/* Structured Data */}
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
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}

      <PlotGenerate section={section} />

      {feature1_section && (
        <FeatureIntro section={feature1_section} accent="orange" />
      )}

      {feature_section && (
        <Benefits section={feature_section} accent="orange" />
      )}

      {feature3_section && (
        <HowToUse section={feature3_section} accent="orange" />
      )}

      {faq_section && (
        <FAQ section={faq_section} accent="orange" />
      )}

      <ModuleToolsSection
        module="ai-write"
        title={t("ai_tools.section_title_hub")}
        description={t("ai_tools.section_description_hub")}
        excludeSlug="plot-generator"
                accent="orange"
      />

      {cta_section && (
        <CTA section={cta_section} accent="orange" />
      )}

    </>
  );
}
