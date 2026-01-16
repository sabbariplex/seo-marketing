import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const diagnostics: any = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set',
    hasPrisma: !!prisma,
    prismaType: typeof prisma,
    nodeEnv: process.env.NODE_ENV,
    nextRuntime: process.env.NEXT_RUNTIME,
    nextPhase: process.env.NEXT_PHASE,
  }

  // Try to connect to database
  if (prisma) {
    try {
      // Try a simple query
      const userCount = await prisma.user.count()
      diagnostics.databaseConnected = true
      diagnostics.userCount = userCount
      
      // Try to list users
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        }
      })
      diagnostics.sampleUsers = users
    } catch (error: any) {
      diagnostics.databaseConnected = false
      diagnostics.databaseError = error.message
      diagnostics.errorStack = error.stack
    }
  } else {
    diagnostics.databaseConnected = false
    diagnostics.error = 'Prisma client is null'
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
