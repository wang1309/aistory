import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import PoemGenerate from "@/components/blocks/poem-generate";
import Testimonial from "@/components/blocks/testimonial";
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

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/poem-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/poem-generator`;
  }

  // Load translations for metadata
  const messages = await import(`@/i18n/pages/poem-generate/${locale}.json`);
  const metadata = messages.default.metadata;

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
      title: metadata.title,
      description: metadata.description,
    },
  };
}

export default async function PoemGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Load translations
  const messages = await import(`@/i18n/pages/poem-generate/${locale}.json`);
  const section = messages.default.poemGenerate;
  const { feature1_section, feature_section, feature3_section, poem_applications_section, testimonial_section, faq_section, cta_section } = section;

  // Build URLs for breadcrumb structured data
  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/poem-generator`;

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
        "name": "Poem Generator",
        "item": currentUrl,
      },
    ],
  };

  // WebApplication JSON-LD for the Poem Generator tool
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI Poem Generator",
    "description": "AI-powered tool for creating poems in various styles including modern poetry, classical Chinese poetry, haiku, sonnets, and song lyrics",
    "url": currentUrl,
    "applicationCategory": "CreativeWork",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "featureList": [
      "Modern poetry generation",
      "Classical Chinese poetry (Jueju, Lüshi, Ci)",
      "Format poetry (Haiku, Sonnet, Limerick, Acrostic)",
      "Song lyrics creation",
      "Multi-language support (12 languages)",
      "Customizable themes and moods",
      "Rhyme scheme control",
      "Poem analysis",
      "Text-to-speech recitation",
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

      {/* Main Component */}
      <div className="container mx-auto px-4 py-12">
        <PoemGenerate section={section} />
      </div>

      {/* Feature1 Section - Full Width */}
      {feature1_section && (
        <Feature1 section={feature1_section} />
      )}

      {/* Feature2 Section - Full Width, Interactive */}
      {feature_section && (
        <Feature2 section={feature_section} />
      )}

      {/* Feature Section - Full Width, Applications Grid */}
      {poem_applications_section && (
        <Feature section={poem_applications_section} />
      )}

      {/* Feature3 Section - Full Width, Usage Guide */}
      {feature3_section && (
        <Feature3 section={feature3_section} />
      )}

      {/* Testimonial Section - Full Width, User Reviews */}
      {testimonial_section && (
        <Testimonial section={testimonial_section} />
      )}

      {/* FAQ Section - Full Width, Common Questions */}
      {faq_section && (
        <FAQ section={faq_section} />
      )}

       {/* CTA Section - Full Width, Call to Action */}
      {cta_section && (
        <CTA section={cta_section} />
      )}

    </>
  );
}
