'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface MetricChartProps {
  title: string
  data: any[]
  type?: 'line' | 'area' | 'bar'
  dataKey?: string
  dataKeys?: string[]
  xAxisKey?: string
  color?: string
  colors?: string[]
  height?: number
  description?: string
}

export function MetricChart({
  title,
  data,
  type = 'line',
  dataKey,
  dataKeys,
  xAxisKey = 'date',
  color = '#3b82f6',
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  height = 300,
  description
}: MetricChartProps) {
  const ChartComponent = type === 'line' ? LineChart : type === 'area' ? AreaChart : BarChart
  const DataComponent = type === 'line' ? Line : type === 'area' ? Area : Bar

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey={xAxisKey}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '6px'
              }}
            />
            <Legend />
            {dataKeys && dataKeys.length > 0 ? (
              dataKeys.map((key, index) => (
                <DataComponent
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={type === 'area' ? 0.6 : 1}
                />
              ))
            ) : dataKey ? (
              <DataComponent
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fill={color}
                fillOpacity={type === 'area' ? 0.6 : 1}
              />
            ) : null}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
