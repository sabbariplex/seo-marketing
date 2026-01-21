import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

// Conditionally import Prisma and adapter only when needed
let prisma: any = null
let PrismaAdapter: any = null

// Skip Prisma adapter load - we're using JWT strategy
// If DATABASE_URL is set, Prisma will be imported dynamically when needed in API routes

// Use JWT strategy (Prisma will be loaded dynamically in API routes if needed)
const useDatabase = false
const adapterInstance = undefined

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
        
        // Get tokens from Account table when using database strategy
        // PrismaAdapter automatically saves tokens to Account table
        if (useDatabase && prisma) {
          try {
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
          } catch (error: any) {
            console.error('[AUTH SESSION] Error fetching account tokens:', error.message)
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
      // Verify user was saved to database and update name if missing
      if (useDatabase && prisma) {
        try {
          const savedUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })
          if (savedUser) {
            // Update user name if it's missing but we have it from OAuth
            if (!savedUser.name && user.name) {
              await prisma.user.update({
                where: { id: savedUser.id },
                data: { name: user.name }
              })
            }
            
            // Update user image if it's missing but we have it from OAuth
            if (!savedUser.image && user.image) {
              await prisma.user.update({
                where: { id: savedUser.id },
                data: { image: user.image }
              })
            }
          }
        } catch (dbError: any) {
          console.error('[AUTH EVENT] Error checking/updating database for user:', dbError.message)
        }
      }
    },
  },
  pages: {
    signIn: '/settings', // Redirect to settings page after sign in
  },
  debug: process.env.NODE_ENV === 'development',
}
