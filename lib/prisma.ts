// Prisma initialization for serverless environments (Vercel)
// Safe for build-time loading - delayed initialization

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

let _prismaClient: PrismaClient | null = null
let _initError: Error | null = null

function getPrismaClient(): PrismaClient {
  if (_prismaClient) {
    console.log('[PRISMA] Returning cached client')
    return _prismaClient
  }

  // If we already tried to initialize and failed, throw the cached error
  if (_initError) {
    console.log('[PRISMA] Throwing cached initialization error:', _initError.message)
    throw _initError
  }

  const databaseUrl = process.env.DATABASE_URL
  console.log('[PRISMA] Initializing new client, DATABASE_URL set:', !!databaseUrl)
  
  if (!databaseUrl) {
    const error = new Error('DATABASE_URL environment variable is not set')
    _initError = error
    console.error('[PRISMA] DATABASE_URL not set, caching error')
    throw error
  }

  try {
    console.log('[PRISMA] Creating Pool and Adapter...')
    const pool = new Pool({ connectionString: databaseUrl })
    const adapter = new PrismaPg(pool)
    console.log('[PRISMA] Creating PrismaClient...')
    _prismaClient = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
      errorFormat: 'minimal',
    })
    console.log('[PRISMA] Client created successfully')

    if (typeof window === 'undefined') {
      process.on('beforeExit', async () => {
        try {
          await _prismaClient?.$disconnect()
        } catch (e) {
          // ignore
        }
      })
    }

    return _prismaClient
  } catch (error) {
    console.error('[PRISMA] Initialization failed:', error)
    _initError = error as Error
    throw error
  }
}

// Return a proxy that initializes Prisma on first property access
export const prisma: any = new Proxy({}, {
  get(_, prop) {
    const client = getPrismaClient()
    return (client as any)[prop]
  },
  has(_, prop) {
    const client = getPrismaClient()
    return prop in client
  },
  ownKeys(_) {
    const client = getPrismaClient()
    return Reflect.ownKeys(client)
  },
  getOwnPropertyDescriptor(_, prop) {
    const client = getPrismaClient()
    return Object.getOwnPropertyDescriptor(client, prop)
  },
})
