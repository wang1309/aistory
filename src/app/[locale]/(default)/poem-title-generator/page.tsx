import HeroPoemTitle from "@/components/blocks/hero-poem-title";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import FAQ from "@/components/blocks/faq";
import CTA from "@/components/blocks/cta";
import { setRequestLocale } from "next-intl/server";
import ModuleToolsSection from "@/components/blocks/module-tools";
import { getTranslations } from "next-intl/server";

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
    const messages = await import(`@/i18n/pages/poem-title-generate/${locale}.json`);
    const section = messages.default.hero_poem_title;

    let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/poem-title-generator`;
    if (locale !== "en") {
        canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/poem-title-generator`;
    }

    return {
        title: section.header.meta_title,
        description: section.header.meta_description,
        alternates: {
            canonical: canonicalUrl,
        },
    };
}

export default async function PoemTitleGeneratorPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Load translations for the poem title page
    const messages = await import(`@/i18n/pages/poem-title-generate/${locale}.json`);
    const t = await getTranslations();
    const section = messages.default.hero_poem_title;
    const featureIntro = messages.default.feature_intro;
    const featureBenefits = messages.default.feature_benefits;
    const faq = messages.default.faq;
    const cta = messages.default.cta;

    // Build URLs for breadcrumb structured data
    const homeUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    const currentUrl = `${homeUrl}${locale === "en" ? "" : `/${locale}`}/poem-title-generator`;

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

    return (
        <>
            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <HeroPoemTitle section={section} />
            <Feature1 section={featureIntro} />
            <Feature2 section={featureBenefits} />
            <FAQ section={faq} />
            <ModuleToolsSection
                module="ai-write"
                title={t("ai_tools.section_title_hub")}
                description={t("ai_tools.section_description_hub")}
                excludeSlug="poem-title-generator"
            />
            <CTA section={cta} />
        </>
    );
}
