// Prisma initialization for serverless environments (Vercel)
// Safe for build-time loading - delayed initialization

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

let _prismaClient: PrismaClient | null = null
let _initError: Error | null = null

function getPrismaClient(): PrismaClient {
  if (_prismaClient) {
    return _prismaClient
  }

  // If we already tried to initialize and failed, throw the cached error
  if (_initError) {
    throw _initError
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    const error = new Error('DATABASE_URL environment variable is not set')
    _initError = error
    throw error
  }

  try {
    const pool = new Pool({ connectionString: databaseUrl })
    const adapter = new PrismaPg(pool)
    _prismaClient = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
      errorFormat: 'minimal',
    })

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
