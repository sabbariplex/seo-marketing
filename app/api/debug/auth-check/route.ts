import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const diagnostics: any = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPrisma: !!prisma,
    hasAdapter: !!authOptions.adapter,
    sessionStrategy: authOptions.session?.strategy || 'unknown',
  }

  // Check session
  try {
    const session = await getServerSession(authOptions)
    diagnostics.hasSession = !!session
    diagnostics.sessionEmail = session?.user?.email
    diagnostics.sessionUserId = (session?.user as any)?.id
  } catch (error: any) {
    diagnostics.sessionError = error.message
  }

  // Check database users if Prisma is available
  if (prisma) {
    try {
      const userCount = await prisma.user.count()
      diagnostics.userCount = userCount
      
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
      diagnostics.users = users
    } catch (error: any) {
      diagnostics.databaseError = error.message
    }
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
