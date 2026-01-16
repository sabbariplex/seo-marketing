// Prisma initialization for serverless environments (Vercel)
// Uses singleton pattern to prevent multiple instances

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize Prisma Client with singleton pattern
// This ensures only one instance exists across serverless function invocations
// Prisma 7.2.0+ reads DATABASE_URL from environment automatically
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
    errorFormat: 'minimal',
  })

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
