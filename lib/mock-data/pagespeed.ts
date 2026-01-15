import { PageSpeedMetrics } from '@/types/seo'

export function generatePageSpeedMetrics(url: string = 'https://example.com'): PageSpeedMetrics {
  const lcp = 1500 + Math.random() * 1000 // 1.5s - 2.5s
  const fid = 50 + Math.random() * 100 // 50ms - 150ms
  const cls = Math.random() * 0.2 // 0 - 0.2
  const fcp = 800 + Math.random() * 700 // 0.8s - 1.5s
  const ttfb = 200 + Math.random() * 300 // 200ms - 500ms

  // Calculate overall score (0-100)
  const lcpScore = lcp < 2500 ? 100 - ((lcp - 2500) / 2500) * 100 : 0
  const fidScore = fid < 100 ? 100 - ((fid - 100) / 100) * 100 : 0
  const clsScore = cls < 0.1 ? 100 - (cls / 0.1) * 100 : 0
  const fcpScore = fcp < 1800 ? 100 - ((fcp - 1800) / 1800) * 100 : 0
  const ttfbScore = ttfb < 800 ? 100 - ((ttfb - 800) / 800) * 100 : 0

  const score = Math.round((lcpScore + fidScore + clsScore + fcpScore + ttfbScore) / 5)

  return {
    url,
    lcp: Math.round(lcp),
    fid: Math.round(fid),
    cls: Math.round(cls * 1000) / 1000,
    fcp: Math.round(fcp),
    ttfb: Math.round(ttfb),
    score: Math.max(0, Math.min(100, score)),
    timestamp: new Date().toISOString()
  }
}

export function generateMultiplePageSpeedMetrics(urls: string[]): PageSpeedMetrics[] {
  return urls.map(url => generatePageSpeedMetrics(url))
}
