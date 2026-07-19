import OcGenerate from "@/components/blocks/oc-generate";
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

  const messages = await import(`@/i18n/pages/oc-generate/${locale}.json`);
  const section = messages.default.oc_generate;
  const metadata = section.metadata;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/oc-generator`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/oc-generator`;
  }

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/oc-generator"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "AI Story Generator",
      type: "website",
      images: [
        {
          url: `${webUrl}/share.png`,
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
    },
  };
}

export default async function OcGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await import(`@/i18n/pages/oc-generate/${locale}.json`);
  const t = await getTranslations();
  const section = messages.default.oc_generate;

  const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/oc-generator`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: section.ui.breadcrumb_home,
        item: homeUrl,
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
    applicationCategory: "CreativeWritingApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Three original character concepts per request",
      "Full structured profile with conflict and story hooks",
      "Lock fields and reroll the rest",
      "Local browser drafts and character history",
      "Continue into Backstory, Story, and D&D Backstory generators",
    ],
  };

  const faqSchema =
    section.faq_items?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: section.faq_items.map(
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

      <section id="oc-generator">
        <OcGenerate section={section} />
      </section>

      <RelatedTools
        currentSlug="oc-generator"
        relatedSlugs={[
          "backstory-generator",
          "dnd-backstory-generator",
          "fantasy-generator",
          "fanfic-generator",
          "story-outline-generator",
        ]}
        limit={6}
        title={t("ai_tools.related_title")}
        description={t("ai_tools.section_description_hub")}
        moreHref="/ai-write-tool"
        moreLabel={t("ai_tools.related_more_label")}
        accent="orange"
      />
    </>
  );
}
