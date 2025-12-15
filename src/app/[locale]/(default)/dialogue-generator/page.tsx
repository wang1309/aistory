import DialogueGenerate from "@/components/blocks/dialogue-generate";
import Feature1 from "@/components/blocks/feature1";
import FeatureWhatDialogue from "@/components/blocks/feature-what-dialogue";
import Feature2 from "@/components/blocks/feature2";
import FeatureWhyDialogue from "@/components/blocks/feature-why-dialogue";
import Feature3 from "@/components/blocks/feature3";
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

    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    const pathname = "/dialogue-generator";

    const languages = {
        en: `${webUrl}${pathname}`,
        zh: `${webUrl}/zh${pathname}`,
        de: `${webUrl}/de${pathname}`,
        ko: `${webUrl}/ko${pathname}`,
        ja: `${webUrl}/ja${pathname}`,
        ru: `${webUrl}/ru${pathname}`,
        "x-default": `${webUrl}${pathname}`,
    };

    let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/dialogue-generator`;
    if (locale !== "en") {
        canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/dialogue-generator`;
    }

    const messages = await import(`@/i18n/pages/dialogue-generate/${locale}.json`);
    const metadata = messages.default.metadata;

    return {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        alternates: {
            canonical: canonicalUrl,
            languages,
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

export default async function DialogueGeneratorPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const messages = await import(`@/i18n/pages/dialogue-generate/${locale}.json`);
    const t = await getTranslations();
    const section = messages.default;

    const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/dialogue-generator`;

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
                "name": "Dialogue Generator",
                "item": currentUrl,
            },
        ],
    };

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "AI Dialogue Generator",
        "description": "AI-powered dialogue generator for screenwriters, novelists, game developers, and creative writers",
        "url": currentUrl,
        "applicationCategory": "CreativeWork",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
        },
        "featureList": [
            "Multi-character dialogue generation",
            "Multiple dialogue types and tones",
            "Customizable character personalities",
            "Narrative integration options",
            "Multi-language support",
        ],
    };

    const faqSchema = section.faq?.items ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": section.faq.items.map((item: { title: string; description: string }) => ({
            "@type": "Question",
            "name": item.title,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.description,
            },
        })),
    } : null;

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

            <DialogueGenerate section={section} />

            {section.feature1 && (
                <FeatureWhatDialogue section={section.feature1} />
            )}

            {section.feature2 && (
                <FeatureWhyDialogue section={section.feature2} />
            )}

            {section.feature3 && (
                <Feature3 section={section.feature3} />
            )}

            {section.feature && (
                <Feature section={section.feature} />
            )}

            {section.faq && (
                <FAQ section={section.faq} />
            )}

            <ModuleToolsSection
                module="ai-write"
                title={t("ai_tools.section_title_hub")}
                description={t("ai_tools.section_description_hub")}
                excludeSlug="dialogue-generator"
            />

            {section.cta && (
                <CTA section={section.cta} />
            )}
        </>
    );
}
