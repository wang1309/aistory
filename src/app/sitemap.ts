import { MetadataRoute } from 'next'
import { locales } from '@/i18n/locale'

export default function sitemap(): MetadataRoute.Sitemap {
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org"

  // 主要路由列表
  const routes = [
    '',
    '/privacy-policy',
    '/terms-of-service',
    '/story-generate',
    '/book-title-generator',
    '/fanfic-generator',
    '/plot-generator',
    '/changelog'
  ]

  // 生成所有语言版本的URL
  const urls = locales.flatMap(locale =>
    routes.map(route => {
      const url = locale === 'en'
        ? `${webUrl}${route}`
        : `${webUrl}/${locale}${route}`

      return {
        url: url,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : (route === '/story-generate' || route === '/book-title-generator' || route === '/fanfic-generator' || route === '/plot-generator') ? 0.9 : 0.8,
        alternates: {
          languages: locales.reduce((acc, lang) => {
            const langUrl = lang === 'en'
              ? `${webUrl}${route}`
              : `${webUrl}/${lang}${route}`
            acc[lang] = langUrl
            return acc
          }, {} as Record<string, string>)
        }
      }
    })
  )

  return urls
}