import { KeywordRanking } from '@/types/seo'

export function generateKeywordRankings(): KeywordRanking[] {
  const keywords = [
    { keyword: 'seo services', volume: 12000, difficulty: 65 },
    { keyword: 'digital marketing agency', volume: 8900, difficulty: 72 },
    { keyword: 'content marketing', volume: 6600, difficulty: 58 },
    { keyword: 'link building services', volume: 3200, difficulty: 45 },
    { keyword: 'local seo', volume: 8100, difficulty: 55 },
    { keyword: 'seo audit', volume: 2400, difficulty: 42 },
    { keyword: 'keyword research', volume: 5400, difficulty: 38 },
    { keyword: 'on page seo', volume: 4900, difficulty: 52 },
    { keyword: 'technical seo', volume: 1800, difficulty: 48 },
    { keyword: 'seo consulting', volume: 3600, difficulty: 60 }
  ]

  return keywords.map((kw, index) => {
    const basePosition = index + 1
    const previousPosition = basePosition + Math.floor(Math.random() * 5) - 2
    const position = Math.max(1, Math.min(100, basePosition + Math.floor(Math.random() * 3) - 1))

    return {
      keyword: kw.keyword,
      position,
      previousPosition: Math.max(1, previousPosition),
      url: `https://example.com/${kw.keyword.replace(/\s+/g, '-')}`,
      searchVolume: kw.volume,
      difficulty: kw.difficulty,
      cpc: Math.round((0.5 + Math.random() * 2) * 100) / 100
    }
  })
}

export function getRankingTrend(keyword: string, days: number = 30): { date: string; position: number }[] {
  const data: { date: string; position: number }[] = []
  const basePosition = 5 + Math.random() * 20
  let currentPosition = basePosition

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // Simulate gradual improvement with some volatility
    const change = (Math.random() - 0.4) * 2 // Slight upward bias
    currentPosition = Math.max(1, Math.min(100, currentPosition + change))
    
    data.push({
      date: date.toISOString().split('T')[0],
      position: Math.round(currentPosition)
    })
  }

  return data
}
