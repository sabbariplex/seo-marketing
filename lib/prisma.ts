// Prisma initialization for serverless environments (Vercel)
// Safe for build-time loading - delayed initialization

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

let _prismaClient: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (_prismaClient) {
    return _prismaClient
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set')
  }

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
}

// Return a proxy that initializes Prisma on first property access
export const prisma: any = new Proxy({}, {
  get(_, prop) {
    try {
      const client = getPrismaClient()
      return (client as any)[prop]
    } catch (error) {
      // If we can't initialize (e.g., during build), return undefined for property access
      // This allows the module to be required without errors during build time
      console.warn('[PRISMA] Failed to access property, returning undefined', error)
      return undefined
    }
  },
  has(_, prop) {
    try {
      const client = getPrismaClient()
      return prop in client
    } catch (error) {
      return false
    }
  },
  ownKeys(_) {
    try {
      const client = getPrismaClient()
      return Reflect.ownKeys(client)
    } catch (error) {
      return []
    }
  },
  getOwnPropertyDescriptor(_, prop) {
    try {
      const client = getPrismaClient()
      return Object.getOwnPropertyDescriptor(client, prop)
    } catch (error) {
      return undefined
    }
  },
})
