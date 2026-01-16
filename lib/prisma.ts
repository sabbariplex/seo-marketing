// Safe Prisma initialization that won't fail during build
let prismaInstance: any = null

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

// Initialize Prisma only at runtime (not during build)
// During build, this will be null, which is fine
function initializePrisma() {
  // Skip if already initialized
  if (prismaInstance) {
    return prismaInstance
  }

  // Only initialize if we're server-side and have DATABASE_URL
  if (typeof window === 'undefined' && process.env.DATABASE_URL) {
    // Check if we're in a build context by looking for Next.js build indicators
    // During build, we skip initialization
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-development-build'
    
    // Only skip if we're actually in build phase
    // At runtime, NEXT_RUNTIME will be set, so we should initialize
    if (!isBuildTime) {
      try {
        const { PrismaClient } = require('@prisma/client')
        
        if (!globalForPrisma.prisma) {
          // Create PrismaClient with error handling
          globalForPrisma.prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
            errorFormat: 'minimal',
          })
          
          // Log successful initialization in development
          if (process.env.NODE_ENV === 'development') {
            console.log('✓ Prisma Client initialized successfully')
          }
        }
        
        prismaInstance = globalForPrisma.prisma
      } catch (prismaError: any) {
        // PrismaClient creation failed
        console.error('✗ Prisma Client initialization failed:', prismaError?.message || 'Unknown error')
        prismaInstance = null
      }
    } else {
      // Build time - don't initialize
      if (process.env.NODE_ENV === 'development') {
        console.log('⏭ Skipping Prisma initialization (build time)')
      }
    }
  } else {
    // No DATABASE_URL or client-side
    if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
      console.warn('⚠ DATABASE_URL not set - Prisma will not be initialized')
    }
  }

  return prismaInstance
}

// Initialize immediately if conditions are met
try {
  initializePrisma()
} catch (error) {
  // Silently fail during module load
  prismaInstance = null
}

// Export prisma - will be null during build, initialized at runtime
export const prisma = prismaInstance
