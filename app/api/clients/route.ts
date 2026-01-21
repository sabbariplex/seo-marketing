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

    let prisma
    try {
      const prismaModule = await (import('@/lib/prisma') as any)
      prisma = prismaModule?.prisma
    } catch (importError) {
      console.error('[API] Failed to import Prisma:', importError)
      return NextResponse.json(
        { error: 'Prisma import failed', details: String(importError) },
        { status: 500 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(clients)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    console.error('[GET /api/clients] Error:', errorMsg)
    return NextResponse.json(
      { 
        error: 'Failed to fetch clients', 
        details: errorMsg, 
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
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

    const prisma = (await (import('@/lib/prisma') as any)).prisma

    const body = await request.json()
    const { name, email, website } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        email: email || null,
        website: website || null,
        userId: user.id,
      }
    })
    
    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    console.error('[POST /api/clients] Error:', errorMsg)
    return NextResponse.json(
      { error: 'Failed to create client', details: errorMsg, stack: process.env.NODE_ENV === 'development' ? errorStack : undefined },
      { status: 500 }
    )
  }
}
