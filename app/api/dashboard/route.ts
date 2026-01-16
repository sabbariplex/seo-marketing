import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { google } from 'googleapis'
import { generateTrafficData, generateConversionData, generateSourceData } from '@/lib/mock-data/analytics'
import { generateKeywordRankings } from '@/lib/mock-data/rankings'
import { generateBacklinkMetrics, getBacklinkHistory } from '@/lib/mock-data/backlinks'
import { generatePageSpeedMetrics } from '@/lib/mock-data/pagespeed'

async function fetchGoogleAnalyticsData(propertyId: string, accessToken: string) {
  try {
    const analyticsData = google.analyticsdata('v1beta')
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Fetch traffic, conversions, and sources data
    const [trafficResponse, conversionsResponse, sourcesResponse] = await Promise.all([
      analyticsData.properties.runReport({
        auth,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: startDateStr, endDate: endDateStr }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
        },
      }),
      analyticsData.properties.runReport({
        auth,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: startDateStr, endDate: endDateStr }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'conversions' },
            { name: 'conversionRate' },
          ],
        },
      }),
      analyticsData.properties.runReport({
        auth,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: startDateStr, endDate: endDateStr }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
        },
      }),
    ])

    // Transform traffic data
    const trafficData = trafficResponse.data.rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
      pageviews: parseInt(row.metricValues?.[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[3]?.value || '0') * 100, // Convert to percentage
      avgSessionDuration: Math.round(parseFloat(row.metricValues?.[4]?.value || '0')),
    })) || []

    // Transform conversion data
    const conversionData = conversionsResponse.data.rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      conversions: parseInt(row.metricValues?.[0]?.value || '0'),
      conversionRate: parseFloat(row.metricValues?.[1]?.value || '0') * 100, // Convert to percentage
    })) || []

    // Transform sources data
    const sourceData = sourcesResponse.data.rows?.map((row) => ({
      source: row.dimensionValues?.[0]?.value || 'Unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || []

    return { trafficData, conversionData, sourceData }
  } catch (error) {
    console.error('Error fetching Google Analytics data:', error)
    throw error
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    let trafficData: any[] = []
    let conversionData: any[] = []
    let sourceData: any[] = []
    let useRealData = false

    // Try to fetch real Google Analytics data if user is connected
    if (session?.user?.email) {
      const accessToken = (session as any).accessToken
      
      if (accessToken) {
        // Try to get property ID from database
        let propertyId: string | null = null
        
        try {
          // Lazy load Prisma to avoid build-time issues
          const { prisma } = await import('@/lib/prisma')
          if (prisma) {
            try {
              const user = await prisma.user.findUnique({
                where: { email: session.user.email! },
                include: {
                  integrations: {
                    where: { 
                      type: 'google_analytics',
                      isConnected: true 
                    }
                  }
                }
              })
              
              if (user?.integrations && user.integrations.length > 0) {
                const integration = user.integrations[0]
                const settings = integration.settings as any
                propertyId = settings?.propertyId || null
              }
            } catch (dbError) {
              console.error('Error fetching integration from database:', dbError)
            }
          }
        } catch (prismaError) {
          console.error('Error loading Prisma:', prismaError)
        }

        // If we have property ID and access token, fetch real data
        if (propertyId) {
          try {
            const realData = await fetchGoogleAnalyticsData(propertyId, accessToken)
            trafficData = realData.trafficData
            conversionData = realData.conversionData
            sourceData = realData.sourceData
            useRealData = true
          } catch (gaError) {
            console.error('Failed to fetch Google Analytics data, using mock data:', gaError)
            // Fall through to use mock data
          }
        }
      }
    }

    // Use mock data if real data wasn't fetched
    if (!useRealData) {
      trafficData = generateTrafficData(30)
      conversionData = generateConversionData(30)
      sourceData = generateSourceData()
    }

    // Always use mock data for these (not from Google Analytics)
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

    // Calculate changes (comparing last 7 days vs previous 7 days)
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

    // Calculate bounce rate change
    const recentBounceRate = trafficData.length >= 7
      ? trafficData.slice(-7).reduce((sum, d) => sum + d.bounceRate, 0) / Math.min(7, trafficData.length)
      : avgBounceRate
    const previousBounceRate = trafficData.length >= 14
      ? trafficData.slice(-14, -7).reduce((sum, d) => sum + d.bounceRate, 0) / 7
      : recentBounceRate
    const bounceRateChange = previousBounceRate > 0 ? ((recentBounceRate - previousBounceRate) / previousBounceRate) * 100 : 0

    return NextResponse.json({
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
          change: bounceRateChange
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
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
