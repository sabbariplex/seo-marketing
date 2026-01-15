import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTrafficData, generateConversionData, generateSourceData } from '@/lib/mock-data/analytics'
import { generateKeywordRankings } from '@/lib/mock-data/rankings'
import { generateBacklinkMetrics, getBacklinkHistory } from '@/lib/mock-data/backlinks'
import { generatePageSpeedMetrics } from '@/lib/mock-data/pagespeed'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // In production, fetch client-specific data from database
    // For now, return mock data
    const trafficData = generateTrafficData(30)
    const conversionData = generateConversionData(30)
    const sourceData = generateSourceData()
    const keywordRankings = generateKeywordRankings()
    const backlinkMetrics = generateBacklinkMetrics()
    const backlinkHistory = getBacklinkHistory(30)
    const pageSpeed = generatePageSpeedMetrics()

    // Calculate KPIs
    const totalSessions = trafficData.reduce((sum, d) => sum + d.sessions, 0)
    const totalUsers = trafficData.reduce((sum, d) => sum + d.users, 0)
    const totalConversions = conversionData.reduce((sum, d) => sum + d.conversions, 0)
    const avgConversionRate = conversionData.reduce((sum, d) => sum + d.conversionRate, 0) / conversionData.length
    const avgBounceRate = trafficData.reduce((sum, d) => sum + d.bounceRate, 0) / trafficData.length

    // Calculate changes
    const recentTraffic = trafficData.slice(-7).reduce((sum, d) => sum + d.sessions, 0)
    const previousTraffic = trafficData.slice(-14, -7).reduce((sum, d) => sum + d.sessions, 0)
    const trafficChange = previousTraffic > 0 ? ((recentTraffic - previousTraffic) / previousTraffic) * 100 : 0

    const recentConversions = conversionData.slice(-7).reduce((sum, d) => sum + d.conversions, 0)
    const previousConversions = conversionData.slice(-14, -7).reduce((sum, d) => sum + d.conversions, 0)
    const conversionChange = previousConversions > 0 ? ((recentConversions - previousConversions) / previousConversions) * 100 : 0

    return NextResponse.json({
      clientName: 'Your Company', // In production, fetch from database
      kpis: {
        sessions: {
          value: totalSessions,
          change: trafficChange
        },
        users: {
          value: totalUsers,
          change: trafficChange * 0.95
        },
        conversions: {
          value: totalConversions,
          change: conversionChange
        },
        conversionRate: {
          value: avgConversionRate,
          change: conversionChange * 0.8
        },
        bounceRate: {
          value: avgBounceRate,
          change: -2.5
        },
        avgSessionDuration: {
          value: Math.round(trafficData.reduce((sum, d) => sum + d.avgSessionDuration, 0) / trafficData.length)
        }
      },
      traffic: trafficData,
      conversions: conversionData,
      sources: sourceData,
      keywords: keywordRankings,
      backlinks: {
        metrics: backlinkMetrics,
        history: backlinkHistory
      },
      pageSpeed
    })
  } catch (error) {
    console.error('Client Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
