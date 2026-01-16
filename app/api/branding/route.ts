import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get branding settings for user
    const branding = await prisma.branding.findUnique({
      where: { userId: user.id }
    })

    // Return branding or defaults
    return NextResponse.json({
      logoUrl: branding?.logoUrl || null,
      primaryColor: branding?.primaryColor || '#3b82f6',
      secondaryColor: branding?.secondaryColor || '#1e40af',
      companyName: branding?.companyName || null,
    })
  } catch (error) {
    console.error('Branding API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branding settings', details: String(error) },
      { status: 500 }
    )
  }
}

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
    const { logoUrl, primaryColor, secondaryColor, companyName } = body

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

    // Upsert branding settings
    const branding = await prisma.branding.upsert({
      where: { userId: user.id },
      update: {
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#1e40af',
        companyName: companyName || null,
      },
      create: {
        userId: user.id,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#1e40af',
        companyName: companyName || null,
      },
    })

    return NextResponse.json({
      success: true,
      branding: {
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        companyName: branding.companyName,
      },
      message: 'Branding settings saved successfully'
    })
  } catch (error) {
    console.error('Branding API error:', error)
    return NextResponse.json(
      { error: 'Failed to save branding settings', details: String(error) },
      { status: 500 }
    )
  }
}
