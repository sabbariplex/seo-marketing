import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      hasSession: !!session,
      user: session?.user || null,
      hasAccessToken: !!(session as any)?.accessToken,
      hasRefreshToken: !!(session as any)?.refreshToken,
      sessionKeys: session ? Object.keys(session) : [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to check session',
        details: String(error)
      },
      { status: 500 }
    )
  }
}
