import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Conditionally import Prisma and adapter only when needed
let prisma: any = null
let PrismaAdapter: any = null

console.log('[AUTH] Initializing auth configuration...')
console.log('[AUTH] Environment check:', {
  isServer: typeof window === 'undefined',
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV,
})

try {
  // Only import if we're server-side and have DATABASE_URL
  if (typeof window === 'undefined' && process.env.DATABASE_URL) {
    console.log('[AUTH] Attempting to load Prisma and Adapter...')
    const prismaModule = require('./prisma')
    prisma = prismaModule.prisma
    console.log('[AUTH] Prisma loaded:', { hasPrisma: !!prisma, prismaType: typeof prisma })
    
    const adapterModule = require('@auth/prisma-adapter')
    PrismaAdapter = adapterModule.PrismaAdapter
    console.log('[AUTH] PrismaAdapter loaded:', { hasAdapter: !!PrismaAdapter })
    
    if (prisma && PrismaAdapter) {
      console.log('[AUTH] ✓ PrismaAdapter loaded successfully')
    } else {
      console.warn('[AUTH] ⚠ PrismaAdapter not available - will use JWT strategy')
      console.warn('[AUTH] Details:', { hasPrisma: !!prisma, hasAdapter: !!PrismaAdapter })
    }
  } else {
    console.warn('[AUTH] ⚠ Skipping Prisma/Adapter load:', {
      isServer: typeof window === 'undefined',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    })
  }
} catch (error: any) {
  // Prisma not available (e.g., during build or missing dependencies)
  // This is fine - we'll fall back to JWT strategy
  const errorMsg = error instanceof Error ? error.message : 'Unknown'
  console.error('[AUTH] ✗ Prisma/Adapter not available, using JWT strategy:', errorMsg)
  console.error('[AUTH] Error details:', error)
  if (error.stack) {
    console.error('[AUTH] Error stack:', error.stack)
  }
}

// Use database adapter if DATABASE_URL is set and Prisma is available
const useDatabase = !!process.env.DATABASE_URL && typeof window === 'undefined' && prisma && PrismaAdapter
console.log('[AUTH] Database strategy decision:', {
  useDatabase,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  isServer: typeof window === 'undefined',
  hasPrisma: !!prisma,
  hasAdapter: !!PrismaAdapter,
})

// Create adapter
let adapterInstance: any = undefined
if (useDatabase && prisma && PrismaAdapter) {
  try {
    console.log('[AUTH] Creating PrismaAdapter instance...')
    adapterInstance = PrismaAdapter(prisma)
    console.log('[AUTH] ✓ PrismaAdapter instance created successfully')
  } catch (error: any) {
    console.error('[AUTH] ✗ Failed to create PrismaAdapter:', error.message)
    adapterInstance = undefined
  }
} else {
  console.log('[AUTH] Using JWT strategy (no database adapter)')
}

export const authOptions: NextAuthOptions = {
  adapter: adapterInstance,
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
      console.log('[AUTH SESSION] Session callback triggered')
      console.log('[AUTH SESSION] Context:', {
        hasUser: !!user,
        hasToken: !!token,
        hasSessionUser: !!session.user,
        useDatabase,
        hasPrisma: !!prisma,
      })

      // Ensure session.user exists
      if (!session.user) {
        console.warn('[AUTH SESSION] ⚠ Session.user is missing!')
        return session
      }

      // When using database adapter, user is available from DB
      if (user) {
        console.log('[AUTH SESSION] Using database user:', {
          id: user.id,
          email: user.email,
          name: user.name,
        })
        
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
            console.log('[AUTH SESSION] Fetching account tokens from database...')
            const account = await prisma.account.findFirst({
              where: { userId: user.id, provider: 'google' },
            })
            if (account) {
              console.log('[AUTH SESSION] ✓ Account found in database')
              if (account.access_token) {
                (session as any).accessToken = account.access_token
                console.log('[AUTH SESSION] ✓ Access token added to session')
              }
              if (account.refresh_token) {
                (session as any).refreshToken = account.refresh_token
                console.log('[AUTH SESSION] ✓ Refresh token added to session')
              }
            } else {
              console.warn('[AUTH SESSION] ⚠ Account not found in database for user:', user.id)
            }
          } catch (error: any) {
            console.error('[AUTH SESSION] ✗ Error fetching account tokens:', error.message)
            console.error('[AUTH SESSION] Error stack:', error.stack)
          }
        } else {
          console.warn('[AUTH SESSION] ⚠ Cannot fetch tokens - database not available')
        }
      } else if (token) {
        console.log('[AUTH SESSION] Using JWT token (no database user)')
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
      console.log('[AUTH EVENT] 🔐 SignIn event triggered')
      console.log('[AUTH EVENT] User details:', {
        email: user.email,
        id: user.id,
        name: user.name,
        isNewUser,
      })
      console.log('[AUTH EVENT] Configuration:', {
        useDatabase,
        hasAdapter: !!authOptions.adapter,
        adapterType: authOptions.adapter ? 'PrismaAdapter' : 'none',
        strategy: useDatabase ? 'database' : 'jwt',
        sessionStrategy: authOptions.session?.strategy,
      })
      
      if (account) {
        console.log('[AUTH EVENT] Account details:', {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
        })
      }
      
      // Verify user was saved to database and update name if missing
      if (useDatabase && prisma) {
        try {
          const savedUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })
          if (savedUser) {
            // Update user name if it's missing but we have it from OAuth
            if (!savedUser.name && user.name) {
              console.log('[AUTH EVENT] Updating user name in database...')
              await prisma.user.update({
                where: { id: savedUser.id },
                data: { name: user.name }
              })
              console.log('[AUTH EVENT] ✅ User name updated in database')
            }
            
            // Update user image if it's missing but we have it from OAuth
            if (!savedUser.image && user.image) {
              console.log('[AUTH EVENT] Updating user image in database...')
              await prisma.user.update({
                where: { id: savedUser.id },
                data: { image: user.image }
              })
              console.log('[AUTH EVENT] ✅ User image updated in database')
            }
            
            console.log('[AUTH EVENT] ✅ User confirmed in database:', {
              id: savedUser.id,
              email: savedUser.email,
              name: savedUser.name,
              createdAt: savedUser.createdAt,
            })
          } else {
            console.error('[AUTH EVENT] ✗ User not found in database after sign in!')
          }
        } catch (dbError: any) {
          console.error('[AUTH EVENT] ✗ Error checking/updating database for user:', dbError.message)
        }
      } else if (isNewUser && !useDatabase) {
        console.warn('[AUTH EVENT] ⚠ New user but database not available - using JWT strategy')
        console.warn('[AUTH EVENT] User will NOT be saved to database')
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
