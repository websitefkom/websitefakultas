import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

/**
 * NextAuth route for App Router
 * - Credentials provider (email + password)
 * - Verifies password with bcrypt.compare
 * - Adds `role` and `unitKerja` into JWT and Session
 */
const options = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) return null
        await dbConnect()
        const user = await User.findOne({ email: credentials.email }).lean()
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null
        // Return minimal user object for token creation
        return { id: user._id, name: user.name, email: user.email, role: user.role, unitKerja: user.unitKerja || null }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user }) {
      // On sign in, `user` object is available; persist role & unitKerja
      if (user) {
        token.role = user.role
        token.unitKerja = user.unitKerja || null
        token.id = user.id || user._id
      }
      return token
    },

    async session({ session, token }) {
      // expose role and unitKerja on session.user
      session.user = session.user || {}
      session.user.role = token.role || null
      session.user.unitKerja = token.unitKerja || null
      session.user.id = token.id || null
      return session
    },
  },

  pages: {
    signIn: '/login',
  },

  // require NEXTAUTH_SECRET in production
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(options)

export { handler as GET, handler as POST }
