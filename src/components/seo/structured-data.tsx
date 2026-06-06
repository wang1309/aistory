import { getTranslations } from 'next-intl/server'

interface StructuredDataProps {
  locale: string
  type: 'WebApplication' | 'FAQPage'
}

export default async function StructuredData({ locale, type }: StructuredDataProps) {
  const t = await getTranslations()
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org"
  const canonicalUrl = `${webUrl}${locale === "en" ? "" : `/${locale}`}`

  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": type,
    url: canonicalUrl,
    inLanguage: locale,
  }

  let structuredData = {}

  if (type === 'WebApplication') {
    structuredData = {
      ...baseStructuredData,
      "@type": "WebApplication",
      name: t("metadata.siteName"),
      description: t("metadata.description"),
      url: canonicalUrl,
      applicationCategory: "CreativeWritingApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock"
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "1250",
        bestRating: "5",
        worstRating: "1"
      },
      creator: {
        "@type": "Organization",
        name: "AI Story Generator",
        url: webUrl
      },
      datePublished: "2024-01-01",
      dateModified: new Date().toISOString().split('T')[0]
    }
  } else if (type === 'FAQPage') {
    const faqs = t.raw("structured_data_faq") as Array<{ question: string; answer: string }>

    structuredData = {
      ...baseStructuredData,
      "@type": "FAQPage",
      mainEntity: faqs.map(faq => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer
        }
      }))
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}