'use client'

import { useEffect, useState } from 'react'
import { KPICard } from '@/components/dashboard/KPICard'
import { MetricChart } from '@/components/dashboard/MetricChart'
import { 
  Users, 
  TrendingUp, 
  Target, 
  Clock, 
  MousePointerClick,
  Activity
} from 'lucide-react'

interface DashboardData {
  kpis: {
    sessions: { value: number; change: number }
    users: { value: number; change: number }
    conversions: { value: number; change: number }
    conversionRate: { value: number; change: number }
    bounceRate: { value: number; change: number }
    avgSessionDuration: { value: number }
  }
  traffic: any[]
  conversions: any[]
  sources: any[]
  keywords: any[]
  backlinks: {
    metrics: any
    history: any[]
  }
  pageSpeed: any
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard', {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) {
          console.error('API error:', res.status)
          throw new Error(`API error: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        // Ensure data is an object and not an error response
        if (data && typeof data === 'object' && !data.error) {
          setData(data)
        } else {
          console.error('Invalid data format:', data)
          setData(null)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch dashboard data:', err)
        setData(null)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load dashboard data</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your SEO and marketing performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Sessions"
          value={data.kpis.sessions.value}
          change={data.kpis.sessions.change}
          changeLabel="vs last week"
          icon={<Activity className="h-4 w-4" />}
        />
        <KPICard
          title="Users"
          value={data.kpis.users.value}
          change={data.kpis.users.change}
          changeLabel="vs last week"
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard
          title="Conversions"
          value={data.kpis.conversions.value}
          change={data.kpis.conversions.change}
          changeLabel="vs last week"
          icon={<Target className="h-4 w-4" />}
        />
        <KPICard
          title="Conversion Rate"
          value={`${data.kpis.conversionRate.value.toFixed(1)}%`}
          change={data.kpis.conversionRate.change}
          changeLabel="vs last week"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Bounce Rate"
          value={`${data.kpis.bounceRate.value.toFixed(1)}%`}
          change={data.kpis.bounceRate.change}
          changeLabel="vs last week"
          icon={<MousePointerClick className="h-4 w-4" />}
        />
        <KPICard
          title="Avg. Session"
          value={`${Math.floor(data.kpis.avgSessionDuration.value / 60)}m ${data.kpis.avgSessionDuration.value % 60}s`}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricChart
          title="Traffic Overview"
          data={data.traffic}
          type="area"
          dataKeys={['sessions', 'users']}
          xAxisKey="date"
          description="Organic traffic trends over the last 30 days"
        />
        <MetricChart
          title="Conversions"
          data={data.conversions}
          type="line"
          dataKey="conversions"
          xAxisKey="date"
          description="Conversion tracking over time"
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricChart
          title="Traffic Sources"
          data={data.sources}
          type="bar"
          dataKey="sessions"
          xAxisKey="source"
          description="Breakdown of traffic by source"
        />
        <MetricChart
          title="Backlink Growth"
          data={data.backlinks.history}
          type="area"
          dataKey="count"
          xAxisKey="date"
          description="Total backlinks over time"
        />
      </div>

      {/* Top Keywords Table */}
      <div className="grid gap-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Top Keyword Rankings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Keyword</th>
                  <th className="text-left p-2">Position</th>
                  <th className="text-left p-2">Previous</th>
                  <th className="text-left p-2">Volume</th>
                  <th className="text-left p-2">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {data.keywords.slice(0, 10).map((keyword, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{keyword.keyword}</td>
                    <td className="p-2">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium">
                        #{keyword.position}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      #{keyword.previousPosition}
                    </td>
                    <td className="p-2">{keyword.searchVolume?.toLocaleString()}</td>
                    <td className="p-2">{keyword.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
