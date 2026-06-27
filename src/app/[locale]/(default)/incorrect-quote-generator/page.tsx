import IncorrectQuoteGenerate from "@/components/blocks/incorrect-quote-generate";
import FeatureIntro from "@/components/sections/feature-intro";
import HowToUse from "@/components/sections/how-to-use";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import RelatedTools from "@/components/blocks/related-tools";
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
  const messages = await import(`@/i18n/pages/incorrect-quote/${locale}.json`);
  const section = messages.default.incorrect_quote_generate;
  const metadata = section.metadata;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/incorrect-quote-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/incorrect-quote-generator`;
  }

  const ogImage = `${process.env.NEXT_PUBLIC_WEB_URL}/story.png`;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/incorrect-quote-generator"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: metadata.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [ogImage],
    },
  };
}

export default async function IncorrectQuoteGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/incorrect-quote/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.incorrect_quote_generate;

  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/incorrect-quote-generator`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: section.ui?.breadcrumb_home ?? "Home",
        item: `${homeUrl}${locale === "en" ? "" : `/${locale}`}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: section.ui?.breadcrumb_current ?? "Incorrect Quote Generator",
        item: currentUrl,
      },
    ],
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: section.ui?.title ?? "Incorrect Quote Generator",
    description: section.metadata.description,
    url: currentUrl,
    applicationCategory: "CreativeWork",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Generate short speaker-labelled incorrect quotes for two to six characters",
      "Prompt-guided quote setup with fast streaming output",
      "Safety toggles for clean, non-romantic fandom-friendly results",
      "One-click copy and continue in AI Write",
      "Multi-language output support",
    ],
  };

  const faqSchema =
    section.faq?.items?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: section.faq.items.map(
            (item: { title?: string; description?: string }) => ({
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

      <IncorrectQuoteGenerate section={section} />
      {section.feature1 && <FeatureIntro section={section.feature1} accent="orange" />}
      {section.how_to_use && <HowToUse section={section.how_to_use} accent="orange" />}
      {section.feature2 && <Benefits section={section.feature2} accent="orange" />}
      {section.feature3 && <UseCases section={section.feature3} accent="orange" />}
      {section.faq && <FAQ section={section.faq} accent="orange" />}
      <RelatedTools
        currentSlug="incorrect-quote-generator"
        limit={6}
        title={t("ai_tools.related_title")}
        description={t("ai_tools.section_description_hub")}
        moreHref="/ai-write-tool"
        moreLabel={t("ai_tools.related_more_label")}
        accent="orange"
      />
      {section.cta && <CTA section={section.cta} accent="orange" />}
    </>
  );
}
