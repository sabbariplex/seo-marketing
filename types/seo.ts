export interface KeywordRanking {
  keyword: string
  position: number
  previousPosition: number
  url: string
  searchVolume?: number
  difficulty?: number
  cpc?: number
}

export interface Backlink {
  domain: string
  url: string
  anchorText: string
  domainRating?: number
  referringDomains?: number
  firstSeen: string
  lastSeen: string
}

export interface BacklinkMetrics {
  total: number
  new: number
  lost: number
  referringDomains: number
  domainRating: number
}

export interface PageSpeedMetrics {
  url: string
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  score: number // Overall score 0-100
  timestamp: string
}
