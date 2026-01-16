import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Conditionally import Prisma and adapter only when needed
let prisma: any = null
let PrismaAdapter: any = null

try {
  // Only import if we're server-side and have DATABASE_URL
  if (typeof window === 'undefined' && process.env.DATABASE_URL) {
    const prismaModule = require('./prisma')
    prisma = prismaModule.prisma
    
    const adapterModule = require('@auth/prisma-adapter')
    PrismaAdapter = adapterModule.PrismaAdapter
  }
} catch (error) {
  // Prisma not available (e.g., during build or missing dependencies)
  // This is fine - we'll fall back to JWT strategy
  console.warn('Prisma/Adapter not available, using JWT strategy:', error instanceof Error ? error.message : 'Unknown')
}

// Use database adapter if DATABASE_URL is set and Prisma is available
const useDatabase = !!process.env.DATABASE_URL && typeof window === 'undefined' && prisma && PrismaAdapter

export const authOptions: NextAuthOptions = {
  adapter: useDatabase && prisma ? PrismaAdapter(prisma) : undefined,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // This callback is used for JWT strategy or for additional token data
      // When using database strategy, tokens are stored in Account table by adapter
      if (account && account.access_token) {
        (token as any).accessToken = account.access_token
        if (account.refresh_token) {
          (token as any).refreshToken = account.refresh_token
        }
        if (account.expires_at) {
          (token as any).expiresAt = account.expires_at
        }
      }
      // Store user info in token (for JWT strategy)
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.sub = user.id
      }
      return token
    },
    async session({ session, token, user }) {
      // Ensure session.user exists
      if (!session.user) {
        return session
      }

      // When using database adapter, user is available from DB
      if (user) {
        // Extend session.user with id property
        const sessionUser = session.user as typeof session.user & { id?: string }
        sessionUser.id = user.id
        session.user.email = user.email || session.user.email || null
        session.user.name = user.name || session.user.name || null
        session.user.image = user.image || session.user.image || null
        
        // Get tokens from Account table when using database strategy
        // PrismaAdapter automatically saves tokens to Account table
        if (useDatabase && prisma) {
          try {
            const account = await prisma.account.findFirst({
              where: { userId: user.id, provider: 'google' },
            })
            if (account && account.access_token) {
              (session as any).accessToken = account.access_token
            }
            if (account && account.refresh_token) {
              (session as any).refreshToken = account.refresh_token
            }
          } catch (error) {
            console.error('Error fetching account tokens:', error)
          }
        }
      } else if (token) {
        // Fallback for JWT strategy (when database is not available)
        const tokenAny = token as any
        // Ensure user data is populated
        if (!session.user.email && tokenAny.email) {
          session.user.email = tokenAny.email
        }
        if (!session.user.name && tokenAny.name) {
          session.user.name = tokenAny.name
        }
        if (!session.user.image && tokenAny.picture) {
          session.user.image = tokenAny.picture
        }
        // Add tokens from JWT
        if (tokenAny.accessToken) {
          (session as any).accessToken = tokenAny.accessToken
        }
        if (tokenAny.refreshToken) {
          (session as any).refreshToken = tokenAny.refreshToken
        }
      }
      
      return session
    },
  },
  session: {
    strategy: useDatabase ? 'database' : 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser && useDatabase) {
        console.log('New user created:', user.email)
      }
      if (account) {
        console.log('User signed in:', user.email, 'Provider:', account.provider)
      }
    },
    async session({ session }) {
      // Log session creation for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Session created for:', session.user?.email)
      }
    },
  },
  pages: {
    signIn: '/settings', // Redirect to settings page after sign in
  },
  debug: process.env.NODE_ENV === 'development',
}
