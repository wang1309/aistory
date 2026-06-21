import { MetadataRoute } from 'next'
import { locales } from '@/i18n/locale'

type RouteTier = 'home' | 'tool' | 'legal' | 'meta'

const ROUTE_TIERS: Record<string, RouteTier> = {
  '': 'home',
  '/privacy-policy': 'legal',
  '/terms-of-service': 'legal',
  '/changelog': 'meta',
  '/ai-write': 'tool',
  '/ai-write/editor': 'tool',
  '/ai-write-tool': 'tool',
}

const TOOL_ROUTES = new Set([
  '/story-generate',
  '/book-title-generator',
  '/dialogue-generator',
  '/incorrect-quote-generator',
  '/tiktok-comment-generator',
  '/youtube-name-generator',
  '/youtube-title-generator',
  '/fanfic-generator',
  '/plot-generator',
  '/poem-generator',
  '/story-prompt-generator',
  '/poem-title-generator',
  '/backstory-generator',
  '/dnd-backstory-generator',
  '/comic-generator',
  '/bedtime-story-generator',
  '/fantasy-generator',
  '/romance-story-generator',
])

function getRouteTier(route: string): RouteTier {
  return ROUTE_TIERS[route] ?? (TOOL_ROUTES.has(route) ? 'tool' : 'meta')
}

function lastModForTier(tier: RouteTier): Date {
  switch (tier) {
    case 'home':
      return new Date('2026-06-19')
    case 'tool':
      return new Date('2026-06-20')
    case 'legal':
      return new Date('2026-05-01')
    default:
      return new Date('2026-06-13')
  }
}

function changeFreqForTier(tier: RouteTier): 'daily' | 'weekly' | 'monthly' {
  switch (tier) {
    case 'home':
    case 'tool':
      return 'daily'
    case 'meta':
      return 'weekly'
    case 'legal':
      return 'monthly'
  }
}

function priorityForTier(tier: RouteTier): number {
  switch (tier) {
    case 'home':
      return 1.0
    case 'tool':
      return 0.9
    case 'meta':
      return 0.8
    case 'legal':
      return 0.5
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org"

  const routes = [
    '',
    '/privacy-policy',
    '/terms-of-service',
    '/ai-write',
    '/ai-write/editor',
    '/ai-write-tool',
    '/story-generate',
    '/book-title-generator',
    '/dialogue-generator',
    '/incorrect-quote-generator',
    '/tiktok-comment-generator',
    '/youtube-name-generator',
  '/youtube-title-generator',
    '/fanfic-generator',
    '/plot-generator',
    '/poem-generator',
    '/story-prompt-generator',
    '/poem-title-generator',
    '/backstory-generator',
    '/dnd-backstory-generator',
    '/comic-generator',
    '/bedtime-story-generator',
    '/fantasy-generator',
    '/romance-story-generator',
    '/changelog'
  ]

  return locales.flatMap(locale =>
    routes.map(route => {
      const tier = getRouteTier(route)
      const url = locale === 'en'
        ? `${webUrl}${route}`
        : `${webUrl}/${locale}${route}`

      return {
        url,
        lastModified: lastModForTier(tier),
        changeFrequency: changeFreqForTier(tier),
        priority: priorityForTier(tier),
        alternates: {
          languages: locales.reduce((acc, lang) => {
            const langUrl = lang === 'en'
              ? `${webUrl}${route}`
              : `${webUrl}/${lang}${route}`
            acc[lang] = langUrl
            return acc
          }, { "x-default": `${webUrl}${route}` } as Record<string, string>)
        }
      }
    })
  )
}
