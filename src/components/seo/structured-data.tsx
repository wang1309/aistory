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
    const faqs = [
      {
        question: locale === 'en'
          ? "Is the AI story generator really free?"
          : "AI故事生成器真的免费吗？",
        answer: locale === 'en'
          ? "Yes, our AI story generator is completely free to use. No registration, no hidden fees, no limits on your creativity."
          : "是的，我们的AI故事生成器完全免费使用。无需注册，没有隐藏费用，对您的创意没有任何限制。"
      },
      {
        question: locale === 'en'
          ? "Do I need to sign up to use the story generator?"
          : "使用故事生成器需要注册吗？",
        answer: locale === 'en'
          ? "No sign up required! You can start creating stories immediately without creating an account or providing any personal information."
          : "无需注册！您可以立即开始创作故事，无需创建账户或提供任何个人信息。"
      },
      {
        question: locale === 'en'
          ? "What types of stories can I generate?"
          : "我可以生成什么类型的故事？",
        answer: locale === 'en'
          ? "You can generate various types of stories including fantasy, sci-fi, romance, mystery, adventure, and more. Simply describe what you want!"
          : "您可以生成各种类型的故事，包括奇幻、科幻、浪漫、悬疑、冒险等。只需描述您想要的内容即可！"
      },
      {
        question: locale === 'en'
          ? "Can I export or save my generated stories?"
          : "我可以导出或保存生成的故事吗？",
        answer: locale === 'en'
          ? "Yes! You can easily copy your generated stories and save them in your preferred format. We also support PDF export for your convenience."
          : "可以！您可以轻松复制生成的故事，并以您喜欢的格式保存。我们还支持PDF导出，方便您使用。"
      }
    ]

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