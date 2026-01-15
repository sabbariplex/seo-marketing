import { Backlink, BacklinkMetrics } from '@/types/seo'
import { subDays, format } from 'date-fns'

export function generateBacklinks(count: number = 50): Backlink[] {
  const domains = [
    'example.com',
    'techcrunch.com',
    'forbes.com',
    'mashable.com',
    'entrepreneur.com',
    'inc.com',
    'businessinsider.com',
    'hubspot.com',
    'moz.com',
    'searchengineland.com'
  ]

  const anchorTexts = [
    'best seo agency',
    'digital marketing services',
    'seo experts',
    'click here',
    'learn more',
    'read more',
    'website',
    'homepage',
    'services',
    'about us'
  ]

  const backlinks: Backlink[] = []

  for (let i = 0; i < count; i++) {
    const domain = domains[Math.floor(Math.random() * domains.length)]
    const anchorText = anchorTexts[Math.floor(Math.random() * anchorTexts.length)]
    const daysAgo = Math.floor(Math.random() * 365)
    const firstSeen = subDays(new Date(), daysAgo)
    const lastSeen = subDays(new Date(), Math.floor(Math.random() * 30))

    backlinks.push({
      domain,
      url: `https://${domain}/article-${i + 1}`,
      anchorText,
      domainRating: 20 + Math.random() * 80,
      referringDomains: Math.floor(Math.random() * 1000),
      firstSeen: format(firstSeen, 'yyyy-MM-dd'),
      lastSeen: format(lastSeen, 'yyyy-MM-dd')
    })
  }

  return backlinks.sort((a, b) => (b.domainRating || 0) - (a.domainRating || 0))
}

export function generateBacklinkMetrics(): BacklinkMetrics {
  const total = 1250 + Math.floor(Math.random() * 500)
  const newLinks = Math.floor(total * 0.1)
  const lostLinks = Math.floor(total * 0.05)
  const referringDomains = Math.floor(total * 0.3)
  const domainRating = 40 + Math.random() * 30

  return {
    total,
    new: newLinks,
    lost: lostLinks,
    referringDomains,
    domainRating: Math.round(domainRating * 10) / 10
  }
}

export function getBacklinkHistory(days: number = 30): { date: string; count: number }[] {
  const data: { date: string; count: number }[] = []
  let currentCount = 1000

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    
    // Simulate gradual growth with occasional spikes
    const growth = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0
    const loss = Math.random() > 0.9 ? Math.floor(Math.random() * 2) : 0
    currentCount = Math.max(0, currentCount + growth - loss)
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      count: currentCount
    })
  }

  return data
}
