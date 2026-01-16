import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const diagnostics: any = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPrisma: false,
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

  // Check database users if Prisma is available (lazy load)
  try {
    const { prisma } = await import('@/lib/prisma')
    diagnostics.hasPrisma = !!prisma
    
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
  } catch (prismaError: any) {
    diagnostics.prismaLoadError = prismaError.message
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
