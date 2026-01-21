import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const prisma = (await (import('@/lib/prisma') as any)).prisma
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        client: {
          include: {
            user: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is a client
    if (user.role !== 'client' || !user.clientId) {
      return NextResponse.json(
        { error: 'Access denied. Client access required.' },
        { status: 403 }
      )
    }

    const client = user.client
    if (!client) {
      return NextResponse.json(
        { error: 'Client record not found' },
        { status: 404 }
      )
    }

    // Fetch client-specific data from database
    // For now, return empty data structure - can be extended with actual integrations
    const trafficData: any[] = []
    const conversionData: any[] = []
    const sourceData: any[] = []
    const keywordRankings: any[] = []
    const backlinkMetrics: any = {}
    const backlinkHistory: any[] = []
    const pageSpeed: any = {}

    // Calculate KPIs
    const totalSessions = trafficData.reduce((sum, d) => sum + d.sessions, 0)
    const totalUsers = trafficData.reduce((sum, d) => sum + d.users, 0)
    const totalConversions = conversionData.reduce((sum, d) => sum + d.conversions, 0)
    const avgConversionRate = conversionData.length > 0 
      ? conversionData.reduce((sum, d) => sum + d.conversionRate, 0) / conversionData.length 
      : 0
    const avgBounceRate = trafficData.length > 0 
      ? trafficData.reduce((sum, d) => sum + d.bounceRate, 0) / trafficData.length 
      : 0

    // Calculate changes
    const recentTraffic = trafficData.length >= 7 
      ? trafficData.slice(-7).reduce((sum, d) => sum + d.sessions, 0)
      : trafficData.reduce((sum, d) => sum + d.sessions, 0)
    const previousTraffic = trafficData.length >= 14
      ? trafficData.slice(-14, -7).reduce((sum, d) => sum + d.sessions, 0)
      : recentTraffic
    const trafficChange = previousTraffic > 0 ? ((recentTraffic - previousTraffic) / previousTraffic) * 100 : 0

    const recentConversions = conversionData.length >= 7
      ? conversionData.slice(-7).reduce((sum, d) => sum + d.conversions, 0)
      : conversionData.reduce((sum, d) => sum + d.conversions, 0)
    const previousConversions = conversionData.length >= 14
      ? conversionData.slice(-14, -7).reduce((sum, d) => sum + d.conversions, 0)
      : recentConversions
    const conversionChange = previousConversions > 0 ? ((recentConversions - previousConversions) / previousConversions) * 100 : 0

    return NextResponse.json({
      clientName: client.name,
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
          value: trafficData.length > 0 
            ? Math.round(trafficData.reduce((sum, d) => sum + d.avgSessionDuration, 0) / trafficData.length)
            : 0
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
