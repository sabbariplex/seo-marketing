import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'

// Dynamically import Prisma to avoid build-time issues
let prisma: any = null

// Initialize Prisma adapter synchronously using the Prisma proxy
let adapterInstance: any = null
try {
  if (process.env.DATABASE_URL) {
    // Import Prisma module - the proxy will initialize on first access
    const prismaModule = require('@/lib/prisma')
    prisma = prismaModule.prisma
    
    if (prisma) {
      adapterInstance = PrismaAdapter(prisma)
    }
  }
} catch (error) {
  console.error('[AUTH] Failed to initialize Prisma adapter:', error)
  adapterInstance = undefined
}

export const authOptions: NextAuthOptions = {
  adapter: adapterInstance,
  providers: [
    // Credentials provider for testing/development (only when GOOGLE_CLIENT_ID is not set)
    ...((!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) ? [
      CredentialsProvider({
        name: 'Test Credentials',
        credentials: {
          email: { label: 'Email', type: 'email', placeholder: 'test@example.com' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          // For development/testing only - accept any credentials
          // In production, you should validate against your database
          if (credentials?.email) {
            return {
              id: credentials.email.replace(/[^a-z0-9]/gi, '-'),
              email: credentials.email,
              name: credentials.email.split('@')[0],
              image: null,
            }
          }
          return null
        },
      }),
    ] : []),
    // Google provider (only if configured)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            scope: 'openid email profile https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly',
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      }),
    ] : []),
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
        
        // Get tokens from Account table
        try {
          if (!prisma) {
            const prismaModule = await import('@/lib/prisma')
            prisma = prismaModule.prisma
          }
          
          if (prisma) {
            const account = await prisma.account.findFirst({
              where: { userId: user.id, provider: 'google' },
            })
            if (account) {
              if (account.access_token) {
                (session as any).accessToken = account.access_token
              }
              if (account.refresh_token) {
                (session as any).refreshToken = account.refresh_token
              }
            }
          }
        } catch (error: any) {
          console.error('[AUTH SESSION] Error fetching account tokens:', error.message)
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
    strategy: 'database', // Use database strategy when adapter is available
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Ensure user is saved to database (works with both adapter and manual creation)
      try {
        // Get Prisma client
        if (!prisma) {
          const prismaModule = await import('@/lib/prisma')
          prisma = prismaModule.prisma
        }

        if (prisma && user.email) {
          // Try to find existing user
          let savedUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!savedUser) {
            // Create user if doesn't exist
            savedUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                emailVerified: (user as any).emailVerified ? new Date((user as any).emailVerified) : null,
                role: 'agency', // Default role
              }
            })
          } else {
            // Update user if exists but missing data
            const updateData: any = {}
            if (!savedUser.name && user.name) updateData.name = user.name
            if (!savedUser.image && user.image) updateData.image = user.image
            if (!savedUser.emailVerified && (user as any).emailVerified) {
              updateData.emailVerified = new Date((user as any).emailVerified)
            }

            if (Object.keys(updateData).length > 0) {
              savedUser = await prisma.user.update({
                where: { id: savedUser.id },
                data: updateData
              })
            }
          }

          // Save account if OAuth account exists
          if (account && savedUser) {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                }
              },
              update: {
                access_token: account.access_token || null,
                refresh_token: account.refresh_token || null,
                expires_at: account.expires_at || null,
                token_type: account.token_type || null,
                scope: account.scope || null,
                id_token: account.id_token || null,
                session_state: account.session_state || null,
              },
              create: {
                userId: savedUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token || null,
                refresh_token: account.refresh_token || null,
                expires_at: account.expires_at || null,
                token_type: account.token_type || null,
                scope: account.scope || null,
                id_token: account.id_token || null,
                session_state: account.session_state || null,
              }
            })
          }
        }
      } catch (dbError: any) {
        console.error('[AUTH EVENT] Error saving user to database:', dbError.message)
        // Don't throw - allow sign in to continue even if DB save fails
      }
    },
  },
  pages: {
    signIn: '/settings', // Redirect to settings page after sign in
  },
  debug: process.env.NODE_ENV === 'development',
}
