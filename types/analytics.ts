export interface TrafficData {
  date: string
  sessions: number
  users: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
}

export interface ConversionData {
  date: string
  conversions: number
  conversionRate: number
  revenue?: number
}

export interface SourceData {
  source: string
  sessions: number
  percentage: number
}

export interface PageData {
  page: string
  pageviews: number
  avgTimeOnPage: number
  bounceRate: number
}
