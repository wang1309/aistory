import AiWriteHero from "@/components/ai-write/hero";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
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
  setRequestLocale(locale);

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ai-write`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-write`;
  }

  let metadata: { title?: string; description?: string; keywords?: string };
  try {
    const messages = await import(
      `@/i18n/pages/ai-write-landing/${locale}.json`
    );
    metadata = messages.default.ai_write_landing.metadata;
  } catch {
    metadata = {
      title: "AI Story Writer — Write Stories with AI",
      description:
        "Write stories with an AI partner that remembers your characters and respects your voice.",
    };
  }

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/ai-write"),
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

export default async function AiWriteLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let section: Record<string, any>;
  try {
    const messages = await import(
      `@/i18n/pages/ai-write-landing/${locale}.json`
    );
    section = messages.default.ai_write_landing;
  } catch {
    const messages = await import(
      `@/i18n/pages/ai-write-landing/en.json`
    );
    section = messages.default.ai_write_landing;
  }

  const t = await getTranslations();
  const {
    pain_points,
    how_to_use,
    feature_benefits,
    faq_section,
    cta_section,
  } = section;

  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/ai-write`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: section.ui?.breadcrumb_current || "AI Write",
        item: currentUrl,
      },
    ],
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: section.ui?.title || "AI Story Writer",
    description: section.metadata?.description,
    url: currentUrl,
    applicationCategory: "CreativeWritingApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Story Bible for character consistency",
      "Style Fingerprint to preserve your voice",
      "Inline ghost suggestions",
      "5 AI-powered text operations",
      "16 categorized continuation presets",
      "Chat history persistence across sessions",
      "Ask AI from text selection",
      "Rewrite, continue, and reply to messages",
      "Auto-save and draft recovery",
    ],
  };

  const faqSchema =
    faq_section?.items?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq_section.items.map(
            (item: { title: string; description: string }) => ({
              "@type": "Question",
              name: item.title,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.description,
              },
            })
          ),
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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <AiWriteHero />
      {pain_points && (
        <FeatureIntro section={pain_points} accent="orange" />
      )}
      {how_to_use && <HowToUse section={how_to_use} accent="orange" />}
      {feature_benefits && (
        <Benefits section={feature_benefits} accent="orange" />
      )}
      {faq_section && <FAQ section={faq_section} accent="orange" />}

      <ModuleToolsSection
        module="ai-write"
        title={t("ai_tools.section_title_hub")}
        description={t("ai_tools.section_description_hub")}
        accent="orange"
      />

      {cta_section && <CTA section={cta_section} accent="orange" />}
    </>
  );
}
