'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricChart } from './MetricChart'
import { formatNumber } from '@/lib/utils'
import { BacklinkMetrics } from '@/types/seo'
import { Link2, TrendingUp, TrendingDown } from 'lucide-react'

interface BacklinkTrackerProps {
  metrics: BacklinkMetrics
  history?: { date: string; count: number }[]
}

export function BacklinkTracker({ metrics, history }: BacklinkTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Backlink Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground">Total Backlinks</div>
            <div className="text-2xl font-bold mt-1">
              {formatNumber(metrics.total)}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground">Referring Domains</div>
            <div className="text-2xl font-bold mt-1">
              {formatNumber(metrics.referringDomains)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg border border-border text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-lg font-semibold">{formatNumber(metrics.new)}</div>
            <div className="text-xs text-muted-foreground">New</div>
          </div>
          <div className="p-3 rounded-lg border border-border text-center">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div className="text-lg font-semibold">{formatNumber(metrics.lost)}</div>
            <div className="text-xs text-muted-foreground">Lost</div>
          </div>
          <div className="p-3 rounded-lg border border-border text-center">
            <div className="text-lg font-semibold">{metrics.domainRating.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Domain Rating</div>
          </div>
        </div>

        {history && history.length > 0 && (
          <div>
            <MetricChart
              title="Backlink Growth"
              data={history}
              type="area"
              dataKey="count"
              xAxisKey="date"
              height={200}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
