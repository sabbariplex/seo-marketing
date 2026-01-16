import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      )
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setDate(expires.getDate() + 7) // Expires in 7 days

    // Update client with invite token
    await prisma.client.update({
      where: { id: clientId },
      data: {
        inviteToken: token,
        inviteExpires: expires,
      }
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
      { error: 'Failed to create invite', details: String(error) },
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

    const client = await prisma.client.findUnique({
      where: { inviteToken: token }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      )
    }

    if (client.inviteExpires && new Date() > client.inviteExpires) {
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: client.email,
      clientId: client.id
    })
  } catch (error) {
    console.error('Verify invite error:', error)
    return NextResponse.json(
      { error: 'Failed to verify invite', details: String(error) },
      { status: 500 }
    )
  }
}
