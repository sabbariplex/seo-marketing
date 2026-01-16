// Safe Prisma initialization that won't fail during build
let prismaInstance: any = null

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

// Initialize Prisma only at runtime (not during build)
// During build, this will be null, which is fine
function initializePrisma() {
  console.log('[PRISMA] Initialization check started')
  console.log('[PRISMA] Environment:', {
    isServer: typeof window === 'undefined',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    nextPhase: process.env.NEXT_PHASE,
    nextRuntime: process.env.NEXT_RUNTIME,
  })

  // Skip if already initialized
  if (prismaInstance) {
    console.log('[PRISMA] Already initialized, returning existing instance')
    return prismaInstance
  }

  // Only initialize if we're server-side and have DATABASE_URL
  if (typeof window === 'undefined' && process.env.DATABASE_URL) {
    // Check if we're in a build context by looking for Next.js build indicators
    // During build, we skip initialization
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-development-build'
    
    console.log('[PRISMA] Build time check:', { isBuildTime, nextPhase: process.env.NEXT_PHASE })
    
    // Only skip if we're actually in build phase
    // At runtime, NEXT_RUNTIME will be set, so we should initialize
    if (!isBuildTime) {
      try {
        console.log('[PRISMA] Attempting to require PrismaClient...')
        const { PrismaClient } = require('@prisma/client')
        console.log('[PRISMA] PrismaClient required successfully')
        
        if (!globalForPrisma.prisma) {
          console.log('[PRISMA] Creating new PrismaClient instance...')
          // Create PrismaClient with error handling
          globalForPrisma.prisma = new PrismaClient({
            log: ['error', 'warn', 'info'],
            errorFormat: 'pretty',
          })
          console.log('[PRISMA] ✓ PrismaClient created successfully')
          
          // Test connection
          globalForPrisma.prisma.$connect()
            .then(() => {
              console.log('[PRISMA] ✓ Database connection established')
            })
            .catch((err: any) => {
              console.error('[PRISMA] ✗ Database connection failed:', err.message)
            })
        } else {
          console.log('[PRISMA] Using existing global PrismaClient instance')
        }
        
        prismaInstance = globalForPrisma.prisma
        console.log('[PRISMA] ✓ Prisma instance ready')
      } catch (prismaError: any) {
        // PrismaClient creation failed
        console.error('[PRISMA] ✗ PrismaClient initialization failed:', prismaError?.message || 'Unknown error')
        console.error('[PRISMA] Error stack:', prismaError?.stack)
        prismaInstance = null
      }
    } else {
      // Build time - don't initialize
      console.log('[PRISMA] ⏭ Skipping Prisma initialization (build time)')
    }
  } else {
    // No DATABASE_URL or client-side
    if (typeof window === 'undefined') {
      console.warn('[PRISMA] ⚠ DATABASE_URL not set or client-side - Prisma will not be initialized')
      console.warn('[PRISMA] Details:', {
        isServer: typeof window === 'undefined',
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      })
    }
  }

  return prismaInstance
}

// Initialize immediately if conditions are met
try {
  initializePrisma()
} catch (error: any) {
  console.error('[PRISMA] ✗ Fatal error during initialization:', error?.message || 'Unknown error')
  prismaInstance = null
}

// Export prisma - will be null during build, initialized at runtime
export const prisma = prismaInstance
