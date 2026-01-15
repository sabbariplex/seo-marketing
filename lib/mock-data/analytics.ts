import { TrafficData, ConversionData, SourceData, PageData } from '@/types/analytics'
import { subDays, format } from 'date-fns'

export function generateTrafficData(days: number = 30): TrafficData[] {
  const data: TrafficData[] = []
  const baseSessions = 5000
  const variance = 0.2

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dayOfWeek = date.getDay()
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1
    const randomFactor = 1 + (Math.random() - 0.5) * variance
    
    const sessions = Math.round(baseSessions * weekendMultiplier * randomFactor)
    const users = Math.round(sessions * 0.75)
    const pageviews = Math.round(sessions * 2.5)
    const bounceRate = 45 + Math.random() * 15
    const avgSessionDuration = 120 + Math.random() * 60

    data.push({
      date: format(date, 'yyyy-MM-dd'),
      sessions,
      users,
      pageviews,
      bounceRate: Math.round(bounceRate * 10) / 10,
      avgSessionDuration: Math.round(avgSessionDuration)
    })
  }

  return data
}

export function generateConversionData(days: number = 30): ConversionData[] {
  const data: ConversionData[] = []
  const baseConversions = 50
  const baseConversionRate = 1.5

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const randomFactor = 1 + (Math.random() - 0.5) * 0.3
    
    const conversions = Math.round(baseConversions * randomFactor)
    const conversionRate = baseConversionRate + (Math.random() - 0.5) * 0.5
    const revenue = conversions * (50 + Math.random() * 100)

    data.push({
      date: format(date, 'yyyy-MM-dd'),
      conversions,
      conversionRate: Math.round(conversionRate * 10) / 10,
      revenue: Math.round(revenue)
    })
  }

  return data
}

export function generateSourceData(): SourceData[] {
  const sources = [
    { name: 'Organic Search', base: 60 },
    { name: 'Direct', base: 20 },
    { name: 'Social Media', base: 10 },
    { name: 'Referral', base: 5 },
    { name: 'Email', base: 3 },
    { name: 'Paid Search', base: 2 }
  ]

  const total = sources.reduce((sum, s) => sum + s.base, 0)
  
  return sources.map(source => ({
    source: source.name,
    sessions: Math.round(source.base * 100),
    percentage: Math.round((source.base / total) * 1000) / 10
  }))
}

export function generatePageData(): PageData[] {
  const pages = [
    '/',
    '/about',
    '/services',
    '/blog',
    '/contact',
    '/pricing',
    '/case-studies',
    '/resources'
  ]

  return pages.map(page => {
    const pageviews = Math.round(1000 + Math.random() * 5000)
    const avgTimeOnPage = 60 + Math.random() * 180
    const bounceRate = 30 + Math.random() * 40

    return {
      page,
      pageviews,
      avgTimeOnPage: Math.round(avgTimeOnPage),
      bounceRate: Math.round(bounceRate * 10) / 10
    }
  }).sort((a, b) => b.pageviews - a.pageviews)
}
