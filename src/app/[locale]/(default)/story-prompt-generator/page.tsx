import StoryPromptGenerate from "@/components/blocks/story-prompt-generate";
import FeatureIntro from "@/components/sections/feature-intro";
import Benefits from "@/components/sections/benefits";
import UseCases from "@/components/sections/use-cases";
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

    let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/story-prompt-generator`;
    if (locale !== "en") {
        canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/story-prompt-generator`;
    }

    // Load translations for metadata (from i18n JSON)
    const messages = await import(`@/i18n/pages/story-prompt-generate/${locale}.json`);
    const metadata = messages.default.metadata;

    return {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        alternates: {
            canonical: canonicalUrl,
            languages: buildLanguageAlternates("/story-prompt-generator"),
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

export default async function StoryPromptGeneratorPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Load translations
    const messages = await import(`@/i18n/pages/story-prompt-generate/${locale}.json`);
    const t = await getTranslations();
    const section = messages.default.story_prompt_generate;
    const {
        feature_intro,
        feature_benefits,
        feature_section,
        faq_section,
        cta_section,
    } = section;

    // Build URLs for breadcrumb structured data
    const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/story-prompt-generator`;

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
                "name": "Story Prompt Generator",
                "item": currentUrl,
            },
        ],
    };

    // WebApplication JSON-LD
    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Story Prompt Generator",
        "description": "AI-powered story prompt and idea generator for writers",
        "url": currentUrl,
        "applicationCategory": "CreativeWork",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
        },
        "featureList": [
            "Multiple genre support",
            "Customizable story length",
            "Tone and mood selection",
            "Advanced worldbuilding options",
            "Multi-language output",
            "AI-ready prompts",
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
            <StoryPromptGenerate section={section} />

            {feature_intro && <FeatureIntro section={feature_intro} accent="orange" />}
            {feature_benefits && <Benefits section={feature_benefits} accent="orange" />}
            {feature_section && <UseCases section={feature_section} accent="orange" />}
            {faq_section && <FAQ section={faq_section} accent="orange" />}

            <ModuleToolsSection
                module="ai-write"
                title={t("ai_tools.section_title_hub")}
                description={t("ai_tools.section_description_hub")}
                excludeSlug="story-prompt-generator"
                accent="orange"
            />

            {cta_section && <CTA section={cta_section} accent="orange" />}
        </>
    );
}
