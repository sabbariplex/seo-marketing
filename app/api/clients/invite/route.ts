import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

// Mock storage - in production, use database
const clientInvites = new Map<string, {
  clientId: string
  email: string
  token: string
  expires: Date
  agencyUserId: string
}>()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { clientId, email } = body

    if (!clientId || !email) {
      return NextResponse.json(
        { error: 'Client ID and email are required' },
        { status: 400 }
      )
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setDate(expires.getDate() + 7) // Expires in 7 days

    // Store invite (in production, save to database)
    clientInvites.set(token, {
      clientId,
      email,
      token,
      expires,
      agencyUserId: session.user.email!
    })

    // Generate invite link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/client/invite/${token}`

    return NextResponse.json({
      success: true,
      inviteLink,
      token,
      expires: expires.toISOString(),
      message: 'Client invite created successfully'
    })
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const invite = clientInvites.get(token)

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      )
    }

    if (new Date() > invite.expires) {
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: invite.email,
      clientId: invite.clientId
    })
  } catch (error) {
    console.error('Verify invite error:', error)
    return NextResponse.json(
      { error: 'Failed to verify invite' },
      { status: 500 }
    )
  }
}
