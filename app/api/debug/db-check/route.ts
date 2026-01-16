import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('[DB CHECK] Diagnostic endpoint called')
  
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'Not set',
    hasPrisma: !!prisma,
    prismaType: typeof prisma,
    prismaIsNull: prisma === null,
    prismaIsUndefined: prisma === undefined,
    nodeEnv: process.env.NODE_ENV,
    nextRuntime: process.env.NEXT_RUNTIME,
    nextPhase: process.env.NEXT_PHASE,
    isServer: typeof window === 'undefined',
  }

  // Try to connect to database
  if (prisma) {
    console.log('[DB CHECK] Prisma is available, testing connection...')
    try {
      // Try a simple query
      console.log('[DB CHECK] Executing user.count()...')
      const userCount = await prisma.user.count()
      console.log('[DB CHECK] ✓ Database query successful, user count:', userCount)
      
      diagnostics.databaseConnected = true
      diagnostics.userCount = userCount
      
      // Try to list users
      console.log('[DB CHECK] Fetching sample users...')
      const users = await prisma.user.findMany({
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      diagnostics.sampleUsers = users
      console.log('[DB CHECK] ✓ Found', users.length, 'users')
      
      // Check accounts
      const accountCount = await prisma.account.count()
      diagnostics.accountCount = accountCount
      
      // Check sessions
      const sessionCount = await prisma.session.count()
      diagnostics.sessionCount = sessionCount
      
    } catch (error: any) {
      console.error('[DB CHECK] ✗ Database query failed:', error.message)
      diagnostics.databaseConnected = false
      diagnostics.databaseError = error.message
      diagnostics.errorStack = error.stack
      diagnostics.errorCode = error.code
    }
  } else {
    console.warn('[DB CHECK] ⚠ Prisma client is null')
    diagnostics.databaseConnected = false
    diagnostics.error = 'Prisma client is null'
    diagnostics.reason = 'Prisma was not initialized - check DATABASE_URL and initialization logs'
  }

  console.log('[DB CHECK] Diagnostics complete:', diagnostics)
  return NextResponse.json(diagnostics, { status: 200 })
}
