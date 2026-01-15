'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageSpeedMetrics } from '@/types/seo'
import { Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageSpeedWidgetProps {
  metrics: PageSpeedMetrics
}

export function PageSpeedWidget({ metrics }: PageSpeedWidgetProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const formatMetric = (value: number, unit: string) => {
    if (unit === 'ms') return `${Math.round(value)}ms`
    if (unit === 's') return `${(value / 1000).toFixed(2)}s`
    return value.toFixed(3)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Page Speed Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-6">
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - metrics.score / 100)}`}
                className={cn(getScoreColor(metrics.score))}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={cn('text-3xl font-bold', getScoreColor(metrics.score))}>
                  {metrics.score}
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={cn('p-3 rounded-lg', getScoreBgColor(metrics.lcp < 2500 ? 90 : metrics.lcp < 4000 ? 50 : 0))}>
            <div className="text-xs text-muted-foreground mb-1">LCP</div>
            <div className="font-semibold">{formatMetric(metrics.lcp, 'ms')}</div>
            <div className="text-xs text-muted-foreground mt-1">Largest Contentful Paint</div>
          </div>
          <div className={cn('p-3 rounded-lg', getScoreBgColor(metrics.fid < 100 ? 90 : metrics.fid < 300 ? 50 : 0))}>
            <div className="text-xs text-muted-foreground mb-1">FID</div>
            <div className="font-semibold">{formatMetric(metrics.fid, 'ms')}</div>
            <div className="text-xs text-muted-foreground mt-1">First Input Delay</div>
          </div>
          <div className={cn('p-3 rounded-lg', getScoreBgColor(metrics.cls < 0.1 ? 90 : metrics.cls < 0.25 ? 50 : 0))}>
            <div className="text-xs text-muted-foreground mb-1">CLS</div>
            <div className="font-semibold">{metrics.cls.toFixed(3)}</div>
            <div className="text-xs text-muted-foreground mt-1">Cumulative Layout Shift</div>
          </div>
          <div className={cn('p-3 rounded-lg', getScoreBgColor(metrics.fcp < 1800 ? 90 : metrics.fcp < 3000 ? 50 : 0))}>
            <div className="text-xs text-muted-foreground mb-1">FCP</div>
            <div className="font-semibold">{formatMetric(metrics.fcp, 'ms')}</div>
            <div className="text-xs text-muted-foreground mt-1">First Contentful Paint</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
