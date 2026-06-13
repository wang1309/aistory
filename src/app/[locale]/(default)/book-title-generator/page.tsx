import HeroBooktitle from "@/components/blocks/hero-booktitle";
import FeatureIntro from "@/components/sections/feature-intro";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import ModuleToolsSection from "@/components/blocks/module-tools";
import { setRequestLocale, getTranslations } from "next-intl/server";
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

  // Load translations from JSON file
  const messages = await import(`@/i18n/pages/booktitle/${locale}.json`);
  const section = messages.default.hero_booktitle;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/book-title-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/book-title-generator`;
  }

  const ogImageUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/og-book-title-generator.png`;

  return {
    title: section.header.meta_title,
    description: section.header.meta_description,
    openGraph: {
      title: section.header.meta_title,
      description: section.header.meta_description,
      url: canonicalUrl,
      siteName: "AI Story Generator",
      locale: locale,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: section.header.meta_title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: section.header.meta_title,
      description: section.header.meta_description,
      images: [ogImageUrl]
    },
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/book-title-generator"),
    },
  };
}

export default async function BookTitlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Load translations for the booktitle page
  const messages = await import(`@/i18n/pages/booktitle/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.hero_booktitle;
  const featureIntro = messages.default.feature_intro;
  const featureBenefits = messages.default.feature_benefits;
  const featureUsecases = messages.default.feature_usecases;
  const faq = messages.default.faq;
  const cta = messages.default.cta;

  // Build URLs for breadcrumb structured data
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/book-title-generator`;

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

  // FAQPage structured data for rich results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.items.map((item: { title: string; description: string }) => ({
      "@type": "Question",
      "name": item.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.description
      }
    }))
  };

  // WebApplication structured data
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": section.header.meta_title,
    "description": section.header.meta_description,
    "url": currentUrl,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "feature": [
      "AI-powered title generation",
      "Multiple genre support",
      "Tone and style customization",
      "Free unlimited usage"
    ]
  };

  // Combine all structured data
  const structuredData = [breadcrumbSchema, faqSchema, webAppSchema];

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      {structuredData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <HeroBooktitle section={section} />
      <FeatureIntro section={featureIntro} accent="orange" />
      <Benefits section={featureBenefits} accent="orange" />
      <UseCases section={featureUsecases} accent="orange" />
      <FAQ section={faq} accent="orange" />
      <ModuleToolsSection
        module="ai-write"
        title={t("ai_tools.section_title_hub")}
        description={t("ai_tools.section_description_hub")}
        excludeSlug="book-title-generator"
                accent="orange"
      />
      <CTA section={cta} accent="orange" />
    </>
  );
}
