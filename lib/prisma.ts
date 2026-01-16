// Prisma initialization for serverless environments (Vercel)
// Uses singleton pattern to prevent multiple instances

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize Prisma Client with singleton pattern
// This ensures only one instance exists across serverless function invocations
// Prisma 7.2.0+ requires adapter or accelerateUrl in constructor
function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
    errorFormat: 'minimal',
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Store in global to prevent multiple instances in serverless environments
globalForPrisma.prisma = prisma

// Store in global to prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle graceful shutdown
if (typeof window === 'undefined') {
  // Only run on server-side
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
