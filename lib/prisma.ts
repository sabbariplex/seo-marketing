// Prisma initialization for serverless environments (Vercel)
// Uses singleton pattern to prevent multiple instances
// Uses direct connection for better compatibility with serverless environments

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize Prisma Client with singleton pattern
// This ensures only one instance exists across serverless function invocations
function createPrismaClient() {
  console.log('[PRISMA] Initializing Prisma Client...')
  console.log('[PRISMA] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'Not set',
  })

  if (!process.env.DATABASE_URL) {
    const error = new Error('DATABASE_URL environment variable is not set')
    console.error('[PRISMA] ❌ Error:', error.message)
    throw error
  }

  try {
    // Prisma automatically reads DATABASE_URL from environment variables
    // No need to pass datasourceUrl explicitly
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
      errorFormat: 'minimal',
    })

    console.log('[PRISMA] ✓ Prisma Client created successfully')
    console.log('[PRISMA] Client type:', typeof client)
    console.log('[PRISMA] Has user model:', 'user' in client)
    
    // Test if client has expected methods
    if (typeof client.user !== 'undefined') {
      console.log('[PRISMA] ✓ User model is accessible')
      console.log('[PRISMA] User model type:', typeof client.user)
      if (typeof client.user.count === 'function') {
        console.log('[PRISMA] ✓ user.count() method is available')
      } else {
        console.warn('[PRISMA] ⚠ user.count() method is NOT available')
        console.warn('[PRISMA] User model keys:', Object.keys(client.user || {}))
      }
    } else {
      console.error('[PRISMA] ❌ User model is NOT accessible')
      console.error('[PRISMA] Available models:', Object.keys(client).filter(key => !key.startsWith('$') && !key.startsWith('_')))
    }

    return client
  } catch (error: any) {
    console.error('[PRISMA] ❌ Failed to create Prisma Client:', error.message)
    console.error('[PRISMA] Error stack:', error.stack)
    throw error
  }
}

// Initialize with error handling
let prisma: PrismaClient
try {
  // Check if Prisma Client is already initialized
  if (globalForPrisma.prisma) {
    prisma = globalForPrisma.prisma
    console.log('[PRISMA] Using existing Prisma Client instance')
  } else {
    prisma = createPrismaClient()
    globalForPrisma.prisma = prisma
  }
  
  // Verify Prisma Client has models (critical check)
  if (!prisma || typeof prisma !== 'object') {
    throw new Error('Prisma Client is not a valid object')
  }
  
  // Verify user model exists
  if (!('user' in prisma)) {
    console.error('[PRISMA] ❌ User model not found in Prisma Client')
    console.error('[PRISMA] Available keys:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')))
    throw new Error('Prisma Client does not have user model - Prisma Client may not be generated correctly. Run: npx prisma generate')
  }
  
  // Verify user.count method exists
  if (typeof prisma.user?.count !== 'function') {
    console.error('[PRISMA] ❌ user.count() method not available')
    console.error('[PRISMA] User model type:', typeof prisma.user)
    if (prisma.user && typeof prisma.user === 'object') {
      console.error('[PRISMA] User model keys:', Object.keys(prisma.user))
    }
    throw new Error('Prisma Client user.count() method not available - Prisma Client may not be generated correctly. Run: npx prisma generate')
  }
  
  console.log('[PRISMA] ✓ Prisma Client verified and ready')
} catch (error: any) {
  console.error('[PRISMA] ❌ Critical error during initialization:', error.message)
  console.error('[PRISMA] Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
  })
  // Re-throw to prevent silent failures
  throw error
}

// Store in global to prevent multiple instances in serverless environments
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle graceful shutdown
if (typeof window === 'undefined') {
  // Only run on server-side
  process.on('beforeExit', async () => {
    try {
      await prisma.$disconnect()
      console.log('[PRISMA] ✓ Disconnected gracefully')
    } catch (error: any) {
      console.error('[PRISMA] Error during disconnect:', error.message)
    }
  })
}

export { prisma }
