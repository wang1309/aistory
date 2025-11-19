import PlotGenerate from "@/components/blocks/plot-generate";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Testimonial from "@/components/blocks/testimonial";
import FAQ from "@/components/blocks/faq";
import CTA from "@/components/blocks/cta";
import ModuleToolsSection from "@/components/blocks/module-tools";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/plot-generate`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/plot-generate`;
  }

  // Load translations for metadata
  const messages = await import(`@/i18n/pages/plot-generate/${locale}.json`);
  const section = messages.default.plot_generate;
  const metadata = section.metadata;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title ,
      description: metadata.description,
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
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/plot-generate`;

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

      {/* Main Component - 最上方 */}
      <PlotGenerate section={section} />

      {/* Feature1 Section - 中间 */}
      {feature1_section && (
        <Feature1 section={feature1_section} />
      )}

      {/* Feature2 Section - 最下方 */}
      {feature_section && (
        <Feature2 section={feature_section} />
      )}

      {/* Feature3 Section - 最下方 */}
      {feature3_section && (
        <Feature3 section={feature3_section} />
      )}

      {/* Testimonial Section - 最下方 */}
      {testimonial_section && (
        <Testimonial section={testimonial_section} />
      )}

      {/* FAQ Section - 最下方 */}
      {faq_section && (
        <FAQ section={faq_section} />
      )}

      {/* AI Writing tools module */}
      <ModuleToolsSection
        module="ai-write"
        title={t("ai_tools.section_title_hub")}
        description={t("ai_tools.section_description_hub")}
        excludeSlug="plot-generator"
      />

      {/* CTA Section - 最下方 */}
      {cta_section && (
        <CTA section={cta_section} />
      )}

    </>
  );
}
