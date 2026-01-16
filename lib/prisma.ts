// Prisma initialization for serverless environments (Vercel)
// Uses lazy initialization with getter function

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

let _prismaInstance: any = undefined
let _initializationAttempted = false

// Initialize Prisma Client - called on first access
function getPrismaInstance() {
  // Return existing instance if available
  if (globalForPrisma.prisma) {
    _prismaInstance = globalForPrisma.prisma
    return _prismaInstance
  }

  if (_prismaInstance) {
    return _prismaInstance
  }

  // Only initialize if server-side
  if (typeof window !== 'undefined') {
    console.warn('[PRISMA] Cannot initialize on client-side')
    return null
  }

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    if (!_initializationAttempted) {
      console.warn('[PRISMA] DATABASE_URL not set - Prisma will not be initialized')
      _initializationAttempted = true
    }
    return null
  }

  // Skip ONLY during actual build phase
  // In production runtime, NEXT_PHASE won't be set to build phases
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build'
  
  console.log('[PRISMA] Build time check:', {
    isBuildTime,
    nextPhase: process.env.NEXT_PHASE,
    willSkip: isBuildTime,
  })
  
  if (isBuildTime) {
    if (!_initializationAttempted) {
      console.log('[PRISMA] Skipping initialization (build time)')
      _initializationAttempted = true
    }
    return null
  }

  try {
    console.log('[PRISMA] ===== Initializing Prisma Client =====')
    console.log('[PRISMA] Environment check:', {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
      nextPhase: process.env.NEXT_PHASE,
      nextRuntime: process.env.NEXT_RUNTIME,
      isServer: typeof window === 'undefined',
    })

    console.log('[PRISMA] Requiring @prisma/client...')
    const { PrismaClient } = require('@prisma/client')
    console.log('[PRISMA] ✓ PrismaClient required successfully')
    
    console.log('[PRISMA] Creating new PrismaClient instance...')
    globalForPrisma.prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'minimal',
    })
    
    _prismaInstance = globalForPrisma.prisma
    console.log('[PRISMA] ✓ PrismaClient instance created')
    
    // Test connection (async, don't wait)
    globalForPrisma.prisma.$connect()
      .then(() => {
        console.log('[PRISMA] ✓✓✓ Database connection established successfully')
      })
      .catch((err: any) => {
        console.error('[PRISMA] ✗✗✗ Database connection failed:', err.message)
        console.error('[PRISMA] Connection error code:', err.code)
        console.error('[PRISMA] Connection error details:', err)
      })
    
    _initializationAttempted = true
    return _prismaInstance
  } catch (error: any) {
    console.error('[PRISMA] ✗✗✗ CRITICAL: Failed to initialize Prisma Client')
    console.error('[PRISMA] Error message:', error.message)
    console.error('[PRISMA] Error name:', error.name)
    if (error.stack) {
      console.error('[PRISMA] Error stack:', error.stack)
    }
    if (error.code) {
      console.error('[PRISMA] Error code:', error.code)
    }
    _initializationAttempted = true
    _prismaInstance = null
    return null
  }
}

// Export Prisma with getter that initializes on first access
// This ensures it works in serverless environments
export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getPrismaInstance()
    if (!instance) {
      // Return a function that throws for methods
      if (typeof prop === 'string') {
        return () => {
          throw new Error(`Prisma Client is not initialized. Property: ${prop}. Check DATABASE_URL and ensure Prisma Client is generated.`)
        }
      }
      throw new Error(`Prisma Client is not initialized. Property: ${String(prop)}. Check DATABASE_URL and ensure Prisma Client is generated.`)
    }
    const value = instance[prop]
    // Bind functions to the instance
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  }
})
