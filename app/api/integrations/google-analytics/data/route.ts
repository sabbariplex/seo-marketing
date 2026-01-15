import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { google } from 'googleapis'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Get access token from session
    const accessToken = (session as any).accessToken

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Analytics not connected. Please connect your account first.' },
        { status: 401 }
      )
    }

    // Initialize Google Analytics Data API client
    const analyticsData = google.analyticsdata('v1beta')
    
    const auth = new google.auth.OAuth2()
    auth.setCredentials({
      access_token: accessToken,
    })

    // Calculate date range (last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Fetch traffic data
    const [trafficResponse, conversionsResponse] = await Promise.all([
      analyticsData.properties.runReport({
        auth,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [
            {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            },
          ],
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
          dateRanges: [
            {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            },
          ],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'conversions' },
            { name: 'conversionRate' },
          ],
        },
      }),
    ])

    // Transform traffic data
    const trafficData = trafficResponse.data.rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
      pageviews: parseInt(row.metricValues?.[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[3]?.value || '0'),
      avgSessionDuration: Math.round(parseFloat(row.metricValues?.[4]?.value || '0')),
    })) || []

    // Transform conversion data
    const conversionData = conversionsResponse.data.rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      conversions: parseInt(row.metricValues?.[0]?.value || '0'),
      conversionRate: parseFloat(row.metricValues?.[1]?.value || '0'),
    })) || []

    return NextResponse.json({
      traffic: trafficData,
      conversions: conversionData,
    })
  } catch (error: any) {
    console.error('Google Analytics data fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch Google Analytics data',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
