// Safe Prisma initialization that won't fail during build
let prismaInstance: any = null

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

// Initialize Prisma only at runtime (not during build)
// During build, this will be null, which is fine
try {
  // Only initialize if we're server-side and have DATABASE_URL
  if (typeof window === 'undefined' && process.env.DATABASE_URL) {
    // Check if we're in a build context by looking for Next.js build indicators
    // During build, we skip initialization
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-development-build' ||
      (!process.env.NEXT_RUNTIME && process.env.NODE_ENV === 'production')
    
    if (!isBuildTime) {
      try {
        const { PrismaClient } = require('@prisma/client')
        
        if (!globalForPrisma.prisma) {
          // Create PrismaClient with error handling
          globalForPrisma.prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
            errorFormat: 'minimal',
          })
        }
        
        prismaInstance = globalForPrisma.prisma
      } catch (prismaError) {
        // PrismaClient creation failed - this can happen during build
        prismaInstance = null
      }
    }
  }
} catch (error) {
  // Prisma not available - this is OK during build or if client isn't generated
  // Silently fail and export null
  prismaInstance = null
}

// Export prisma - will be null during build, initialized at runtime
export const prisma = prismaInstance
