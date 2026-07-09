import BackstoryGenerate from "@/components/blocks/backstory-generate";
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

    let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/backstory-generator`;
    if (locale !== "en") {
        canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/backstory-generator`;
    }

    // Load translations for metadata
    const messages = await import(`@/i18n/pages/backstory-generate/${locale}.json`);
    const section = messages.default.backstory_generate;
    const metadata = section.metadata;

    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";

    return {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        alternates: {
            canonical: canonicalUrl,
            languages: buildLanguageAlternates("/backstory-generator"),
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

export default async function BackstoryGeneratePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Load translations
    const messages = await import(`@/i18n/pages/backstory-generate/${locale}.json`);
    const t = await getTranslations();
    const section = messages.default.backstory_generate;
    const { feature_intro, how_to_use, feature1_section, feature_section, faq_section, cta_section } = section;

    // Build URLs for breadcrumb structured data
    const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/backstory-generator`;

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
                "name": section.ui.breadcrumb_current,
                "item": currentUrl,
            },
        ],
    };

    // WebApplication JSON-LD
    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": section.ui.title,
        "description": section.metadata.description,
        "url": currentUrl,
        "applicationCategory": "CreativeWritingApplication",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
        },
        "featureList": [
            "Structured character backstory output",
            "Multiple worldview settings (Fantasy, Sci-Fi, DND, Xianxia...)",
            "Role type selection (Hero, Villain, NPC, VTuber...)",
            "Customizable tone and length",
            "Multi-language support",
        ],
    };

    // FAQ JSON-LD
    const faqSchema =
        faq_section?.items?.length
            ? {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faq_section.items.map((item: { title: string; description: string }) => ({
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

            {/* Main Component */}
            <BackstoryGenerate section={section} />

            {/* What is Backstory Generator */}
            {feature_intro && (
                <FeatureIntro section={feature_intro} accent="orange" />
            )}

            {/* How to Use */}
            {how_to_use && (
                <HowToUse section={how_to_use} accent="orange" />
            )}

            {/* Why Use */}
            {feature1_section && (
                <Benefits section={feature1_section} accent="orange" />
            )}

            {/* Use Cases */}
            {feature_section && (
                <UseCases section={feature_section} accent="orange" />
            )}

            {/* FAQ */}
            {faq_section && (
                <FAQ section={faq_section} accent="orange" />
            )}

            {/* Related AI Writing Tools */}
            <RelatedTools
              currentSlug="backstory-generator"
              limit={6}
              title={t("ai_tools.related_title")}
              description={t("ai_tools.section_description_hub")}
              moreHref="/ai-write-tool"
              moreLabel={t("ai_tools.related_more_label")}
              accent="orange"
            />

            {/* CTA */}
            {cta_section && (
                <CTA section={cta_section} accent="orange" />
            )}
        </>
    );
}
