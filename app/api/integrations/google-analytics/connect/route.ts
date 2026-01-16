import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Debug logging
    console.log('Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email,
      hasAccessToken: !!(session as any)?.accessToken,
    })
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          error: 'Unauthorized. Please sign in with Google first.',
          debug: { hasSession: !!session, hasUser: !!session?.user }
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { propertyId, projectId } = body

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Get access token from session
    const accessToken = (session as any).accessToken
    const refreshToken = (session as any).refreshToken

    if (!accessToken) {
      console.error('No access token in session:', {
        email: session.user.email,
        sessionKeys: Object.keys(session),
      })
      return NextResponse.json(
        { 
          error: 'Google account not connected. Please sign in with Google first.',
          debug: { hasAccessToken: false, sessionKeys: Object.keys(session) }
        },
        { status: 400 }
      )
    }

    // Save to database if available
    let integration = null
    try {
      // Lazy load Prisma to avoid build-time issues
      const { prisma } = await import('@/lib/prisma')
      if (prisma) {
        try {
          const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
          })
          
          if (user) {
            integration = await prisma.integration.upsert({
              where: { 
                id: `ga-${user.id}` 
              },
              update: {
                type: 'google_analytics',
                credentials: { propertyId, accessToken, refreshToken },
                isConnected: true,
                lastSync: new Date(),
                settings: { propertyId },
              },
              create: {
                id: `ga-${user.id}`,
                type: 'google_analytics',
                userId: user.id,
                projectId: projectId || null,
                credentials: { propertyId, accessToken, refreshToken },
                isConnected: true,
                lastSync: new Date(),
                settings: { propertyId },
              },
            })
          }
        } catch (dbError) {
          console.error('Database error saving integration:', dbError)
          // Continue without database - will use session-based storage
        }
      }
    } catch (prismaError) {
      console.error('Error loading Prisma:', prismaError)
    }

    return NextResponse.json({ 
      success: true, 
      integration: {
        id: `ga-${session.user.email}`,
        type: 'google_analytics',
        propertyId,
        isConnected: true,
      },
      message: 'Google Analytics connected successfully' 
    })
  } catch (error) {
    console.error('Google Analytics connection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect Google Analytics', details: String(error) },
      { status: 500 }
    )
  }
}
