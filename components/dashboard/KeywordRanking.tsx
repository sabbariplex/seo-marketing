'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricChart } from './MetricChart'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeywordRanking as KeywordRankingType } from '@/types/seo'

interface KeywordRankingProps {
  keywords: KeywordRankingType[]
  showChart?: boolean
  chartData?: { date: string; position: number }[]
}

export function KeywordRanking({ keywords, showChart = false, chartData }: KeywordRankingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Rankings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showChart && chartData && (
          <div className="h-48">
            <MetricChart
              title=""
              data={chartData}
              type="line"
              dataKey="position"
              xAxisKey="date"
              height={200}
            />
          </div>
        )}
        <div className="space-y-2">
          {keywords.slice(0, 10).map((keyword, index) => {
            const change = keyword.previousPosition - keyword.position
            const isImproving = change > 0
            const isDeclining = change < 0
            const isStable = change === 0

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{keyword.keyword}</div>
                  <div className="text-sm text-muted-foreground">
                    {keyword.url}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">#{keyword.position}</div>
                    <div className="text-xs text-muted-foreground">
                      Was #{keyword.previousPosition}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isImproving && (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                    {isDeclining && (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    {isStable && (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isImproving && 'text-green-600',
                        isDeclining && 'text-red-600',
                        isStable && 'text-muted-foreground'
                      )}
                    >
                      {change > 0 ? `+${change}` : change}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
