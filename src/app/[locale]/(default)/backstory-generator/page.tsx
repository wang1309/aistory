import BackstoryGenerate from "@/components/blocks/backstory-generate";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature from "@/components/blocks/feature";
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

    let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/backstory-generator`;
    if (locale !== "en") {
        canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/backstory-generator`;
    }

    // Load translations for metadata
    const messages = await import(`@/i18n/pages/backstory-generate/${locale}.json`);
    const section = messages.default.backstory_generate;
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
    const { feature_intro, feature1_section, feature_section, faq_section, cta_section } = section;

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
                "name": "Backstory Generator",
                "item": currentUrl,
            },
        ],
    };

    // WebApplication JSON-LD
    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Backstory Generator",
        "description": "AI-powered character backstory generator for RPGs, novels, VTubers, and chatbots",
        "url": currentUrl,
        "applicationCategory": "CreativeWork",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
        },
        "featureList": [
            "Structured character backstory",
            "Multiple worldview settings",
            "Role type selection",
            "Customizable tone and length",
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

            {/* Main Component */}
            <BackstoryGenerate section={section} />

            {/* Feature1 Section - What is Backstory Generator */}
            {feature_intro && (
                <Feature1 section={feature_intro} />
            )}

            {/* Feature2 Section - Why use Backstory Generator */}
            {feature1_section && (
                <Feature2 section={feature1_section} />
            )}

            {/* Feature Grid Section - Perfect For / Use cases */}
            {feature_section && (
                <Feature section={feature_section} />
            )}

            {/* FAQ Section */}
            {faq_section && (
                <FAQ section={faq_section} />
            )}

            {/* AI Writing tools module */}
            <ModuleToolsSection
                module="ai-write"
                title={t("ai_tools.section_title_hub")}
                description={t("ai_tools.section_description_hub")}
                excludeSlug="backstory-generator"
            />

            {/* CTA Section */}
            {cta_section && (
                <CTA section={cta_section} />
            )}
        </>
    );
}
