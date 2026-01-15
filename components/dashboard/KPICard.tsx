'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatPercentage } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  description?: string
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  description
}: KPICardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === undefined || change === 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {isPositive && <TrendingUp className="h-4 w-4 text-green-600" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-red-600" />}
            {isNeutral && <Minus className="h-4 w-4 text-muted-foreground" />}
            <span
              className={cn(
                isPositive && 'text-green-600',
                isNegative && 'text-red-600',
                isNeutral && 'text-muted-foreground'
              )}
            >
              {formatPercentage(change)}
            </span>
            {changeLabel && (
              <span className="text-muted-foreground ml-1">
                {changeLabel}
              </span>
            )}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
