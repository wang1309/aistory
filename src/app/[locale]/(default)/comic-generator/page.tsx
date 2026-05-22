import ComicGenerate from "@/components/blocks/comic-generate";
import ComicFeatureIntro from "@/components/blocks/comic-generate/feature-intro";
import ComicBenefits from "@/components/blocks/comic-generate/benefits";
import ComicUseCases from "@/components/blocks/comic-generate/use-cases";
import ComicFAQ from "@/components/blocks/comic-generate/faq";
import ComicCTA from "@/components/blocks/comic-generate/cta";
import ComicHowToUse from "@/components/blocks/comic-generate/how-to-use";
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

    let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/comic-generator`;
    if (locale !== "en") {
        canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/comic-generator`;
    }

    const messages = await import(`@/i18n/pages/comic-generate/${locale}.json`);
    const metadata = messages.default.metadata;

    return {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        alternates: {
            canonical: canonicalUrl,
            languages: buildLanguageAlternates("/comic-generator"),
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

export default async function ComicGeneratorPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const messages = await import(`@/i18n/pages/comic-generate/${locale}.json`);
    const t = await getTranslations();
    const section = messages.default.comic_generate;

    const {
        feature_intro,
        how_to_use,
        feature_benefits,
        feature_section,
        faq_section,
        cta_section,
    } = section;

    const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/comic-generator`;

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
                name: "AI Comic Generator",
                item: currentUrl,
            },
        ],
    };

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "AI Comic Generator",
        description:
            "AI-powered comic script generator for creating panel-by-panel comic dialogue, narration, and scene scripts for manga, webtoon, and comic storytelling.",
        url: currentUrl,
        applicationCategory: "CreativeWork",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        featureList: [
            "Panel-by-panel comic script generation",
            "Multiple comic styles: manga, webtoon, comic strip, graphic novel",
            "Character voice and dialogue consistency",
            "Narration and caption style control",
            "Scene goal and pacing customization",
            "Multi-language output support",
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

            {/* Main Generator Component */}
            <ComicGenerate section={section} />

            {/* What is AI Comic Generator */}
            {feature_intro && <ComicFeatureIntro section={feature_intro} />}

            {/* How to Use */}
            {how_to_use && <ComicHowToUse section={how_to_use} />}

            {/* Why use it / Benefits */}
            {feature_benefits && <ComicBenefits section={feature_benefits} />}

            {/* Use cases / Who should use */}
            {feature_section && <ComicUseCases section={feature_section} />}

            {/* FAQ */}
            {faq_section && <ComicFAQ section={faq_section} />}

            {/* Related AI Writing Tools */}
            <ModuleToolsSection
                module="ai-write"
                title={t("ai_tools.section_title_hub")}
                description={t("ai_tools.section_description_hub")}
                excludeSlug="comic-generator"
            />

            {/* CTA */}
            {cta_section && <ComicCTA section={cta_section} />}
        </>
    );
}
