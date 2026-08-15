import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import { buildLanguageAlternates } from "@/lib/seo";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  // force-static 下 requestLocale 回落 defaultLocale,需显式传 locale 才能拿到正确语言的 messages
  const t = await getTranslations({ locale });

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ai-tools`;
  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-tools`;
  }

  return {
    title: t("ai_tools.tools_hub_title"),
    description: t("ai_tools.tools_hub_description"),
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates("/ai-tools"),
    },
  };
}

export default async function AiToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const webUrl =
    process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
  const baseUrl = locale === "en" ? webUrl : `${webUrl}/${locale}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("ai_tools.tools_hub_title"),
    description: t("ai_tools.tools_hub_description"),
    url: `${baseUrl}/ai-tools`,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: "AI Story Generator",
      url: webUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <section className="relative overflow-hidden py-28 sm:py-36">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_55%_40%_at_50%_0%,oklch(0.96_0.035_65),transparent)] dark:bg-[radial-gradient(ellipse_55%_40%_at_50%_0%,oklch(0.15_0.02_55),transparent)]" />
          <div
            className="absolute -left-[6%] bottom-[8%] h-[320px] w-[320px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
            style={{
              background:
                "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-primary opacity-60" />
              {t("ai_tools.tools_hub_nav")}
            </span>

            <h1 className="mt-5 font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
              {t("ai_tools.tools_hub_title")}
            </h1>

            <div className="flex justify-center">
              <svg
                className="mt-2 mb-5 h-2.5 w-28 text-primary/25"
                viewBox="0 0 160 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 8c30-5 60-6 90-3s40 4 66-1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <p className="mx-auto max-w-md text-base font-light leading-relaxed text-muted-foreground/65">
              {t("ai_tools.tools_hub_description")}
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-lg">
            <div className="flex flex-col items-center gap-4 rounded-[1.1rem] border border-dashed border-amber-500/30 bg-amber-500/[0.04] px-6 py-12 text-center dark:border-amber-400/30 dark:bg-amber-400/[0.04]">
              <span className="flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
                <Icon name="RiToolsLine" className="size-6" />
              </span>
              <h2 className="font-display text-xl font-semibold text-foreground">
                {t("ai_tools.tools_hub_empty_title")}
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground/70">
                {t("ai_tools.tools_hub_empty_desc")}
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href={"/ai-write-tool" as any}
                className="group/cta inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 px-6 py-3 text-sm font-semibold text-white no-underline shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:from-amber-400 hover:to-amber-600 dark:from-amber-400 dark:to-amber-600 dark:text-[oklch(0.20_0.02_55)] dark:hover:from-amber-300 dark:hover:to-amber-500"
              >
                <Icon name="RiQuillPenLine" className="size-4 shrink-0" />
                {t("ai_tools.tools_hub_cta")}
                <Icon
                  name="RiArrowRightLine"
                  className="size-4 shrink-0 transition-transform duration-300 group-hover/cta:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
