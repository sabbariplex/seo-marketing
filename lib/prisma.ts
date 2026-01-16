// Prisma initialization for serverless environments (Vercel)
// Direct initialization that works reliably in production

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

let prismaInstance: any = null

// Initialize Prisma Client
function initializePrisma() {
  // Return existing instance if available
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma
    return prismaInstance
  }

  // Only initialize if server-side
  if (typeof window !== 'undefined') {
    console.warn('[PRISMA] Cannot initialize on client-side')
    return null
  }

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.warn('[PRISMA] DATABASE_URL not set - Prisma will not be initialized')
    return null
  }

  // Skip during build phase only
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build'
  
  if (isBuildTime) {
    console.log('[PRISMA] Skipping initialization (build time)')
    return null
  }

  try {
    console.log('[PRISMA] Initializing Prisma Client...')
    console.log('[PRISMA] Environment:', {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      nextPhase: process.env.NEXT_PHASE,
      nextRuntime: process.env.NEXT_RUNTIME,
    })

    const { PrismaClient } = require('@prisma/client')
    
    console.log('[PRISMA] Creating PrismaClient instance...')
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'info'] : ['error'],
      errorFormat: 'minimal',
    })
    
    prismaInstance = globalForPrisma.prisma
    console.log('[PRISMA] ✓ PrismaClient created successfully')
    
    // Test connection (async, don't wait)
    globalForPrisma.prisma.$connect()
      .then(() => {
        console.log('[PRISMA] ✓ Database connection established')
      })
      .catch((err: any) => {
        console.error('[PRISMA] ✗ Database connection failed:', err.message)
      })
    
    return prismaInstance
  } catch (error: any) {
    console.error('[PRISMA] ✗ Failed to initialize Prisma Client:', error.message)
    if (error.stack) {
      console.error('[PRISMA] Error stack:', error.stack)
    }
    prismaInstance = null
    return null
  }
}

// Initialize immediately if conditions are met
if (typeof window === 'undefined' && process.env.DATABASE_URL) {
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build'
  
  if (!isBuildTime) {
    try {
      initializePrisma()
    } catch (error: any) {
      console.error('[PRISMA] Fatal error during module load:', error.message)
    }
  }
}

// Export Prisma instance directly
export const prisma = prismaInstance
