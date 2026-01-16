// Prisma initialization for serverless environments (Vercel)
// Uses singleton pattern to prevent multiple instances
// Uses direct connection for better compatibility with serverless environments

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

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

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    const error = new Error('DATABASE_URL environment variable is not set')
    console.error('[PRISMA] ❌ Error:', error.message)
    throw error
  }

  try {
    // Prisma 7 requires an adapter or accelerateUrl
    // Create a pg Pool and adapter for Prisma
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/prisma.ts:31',message:'Before creating pool and adapter',data:{hasDatabaseUrl:!!databaseUrl,prismaClientType:typeof PrismaClient,PrismaClientIsFunction:typeof PrismaClient === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    const pool = new Pool({ connectionString: databaseUrl })
    const adapter = new PrismaPg(pool)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/prisma.ts:36',message:'Before creating PrismaClient',data:{adapterType:typeof adapter,hasAdapter:!!adapter},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    const client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
      errorFormat: 'minimal',
    })
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/prisma.ts:42',message:'After creating PrismaClient',data:{clientType:typeof client,clientConstructor:client.constructor?.name,isPrismaClient:client instanceof PrismaClient},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    console.log('[PRISMA] ✓ Prisma Client created successfully')
    console.log('[PRISMA] Client type:', typeof client)
    console.log('[PRISMA] Has user model:', 'user' in client)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/prisma.ts:43',message:'Prisma client created',data:{clientType:typeof client,hasUser:'user' in client,clientKeys:Object.keys(client).filter(k=>!k.startsWith('$')&&!k.startsWith('_')).slice(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Test if client has expected methods
    if (typeof client.user !== 'undefined') {
      console.log('[PRISMA] ✓ User model is accessible')
      console.log('[PRISMA] User model type:', typeof client.user)
      
      // #region agent log
      const userModelKeys = typeof client.user === 'object' && client.user ? Object.keys(client.user) : [];
      fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/prisma.ts:51',message:'User model inspection',data:{userModelType:typeof client.user,hasCount:typeof client.user.count === 'function',userModelKeys:userModelKeys.slice(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (typeof client.user.count === 'function') {
        console.log('[PRISMA] ✓ user.count() method is available')
      } else {
        console.warn('[PRISMA] ⚠ user.count() method is NOT available')
        console.warn('[PRISMA] User model keys:', Object.keys(client.user || {}))
      }
    } else {
      console.error('[PRISMA] ❌ User model is NOT accessible')
      console.error('[PRISMA] Available models:', Object.keys(client).filter(key => !key.startsWith('$') && !key.startsWith('_')))
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/prisma.ts:58',message:'User model NOT accessible',data:{availableModels:Object.keys(client).filter(k=>!k.startsWith('$')&&!k.startsWith('_')).slice(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/prisma.ts:88',message:'User model not found during verification',data:{availableKeys:Object.keys(prisma).filter(k=>!k.startsWith('$')&&!k.startsWith('_')).slice(0,10),prismaType:typeof prisma},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    throw new Error('Prisma Client does not have user model - Prisma Client may not be generated correctly. Run: npx prisma generate')
  }
  
  // Verify user.count method exists
  if (typeof prisma.user?.count !== 'function') {
    console.error('[PRISMA] ❌ user.count() method not available')
    console.error('[PRISMA] User model type:', typeof prisma.user)
    if (prisma.user && typeof prisma.user === 'object') {
      console.error('[PRISMA] User model keys:', Object.keys(prisma.user))
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/prisma.ts:95',message:'user.count() not available during verification',data:{userModelType:typeof prisma.user,userModelKeys:prisma.user&&typeof prisma.user==='object'?Object.keys(prisma.user).slice(0,20):[],hasUser:!!prisma.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    throw new Error('Prisma Client user.count() method not available - Prisma Client may not be generated correctly. Run: npx prisma generate')
  }
  
  console.log('[PRISMA] ✓ Prisma Client verified and ready')
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/prisma.ts:104',message:'Prisma client verified successfully',data:{hasUser:'user' in prisma,hasUserCount:typeof prisma.user?.count === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
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
