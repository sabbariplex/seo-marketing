import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Build auth options - use JWT strategy by default (works without database)
// If DATABASE_URL is set, you can add PrismaAdapter later
export const authOptions: NextAuthOptions = {
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
  callbacks: {
    async jwt({ token, account }) {
      if (account && account.access_token) {
        (token as any).accessToken = account.access_token
        if (account.refresh_token) {
          (token as any).refreshToken = account.refresh_token
        }
        if (account.expires_at) {
          (token as any).expiresAt = account.expires_at
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        const tokenAny = token as any
        (session as any).accessToken = tokenAny.accessToken
        (session as any).refreshToken = tokenAny.refreshToken
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  // Use JWT strategy (works without database)
  session: {
    strategy: 'jwt',
  },
}
