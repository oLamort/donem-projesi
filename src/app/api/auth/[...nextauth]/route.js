import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import axios from 'axios'
import apiService from '@/services/api';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const response = await apiService.post('/auth/login', credentials);

          if (response.success && response.user) {
            const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || '';

            let avatar = response.user.avatar;
            if (avatar && !avatar.startsWith('http')) {
              avatar = `${API_URL}${avatar}`;
            }

            let banner = response.user.banner;
            if (banner && !banner.startsWith('http')) {
              banner = `${API_URL}${banner}`;
            }

            return {
              id: response.user.id,
              username: response.user.username,
              email: response.user.email,
              role: response.user.role,
              avatar: avatar,
              banner: banner,
              bio: response.user.bio,
              rank: response.user.rank,
              role: response.user.role,
              token: response.token
            }
          }
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.email = user.email
        token.role = user.role
        token.avatar = user.avatar
        token.banner = user.banner
        token.bio = user.bio
        token.rank = user.rank
        token.role = user.role
        token.apiToken = user.token
      }

      // Handle session updates (e.g. from updateSession client-side)
      if (trigger === "update" && session) {
        if (session.user) {
          if (session.user.avatar !== undefined) token.avatar = session.user.avatar;
          if (session.user.banner !== undefined) token.banner = session.user.banner;
          if (session.user.bio !== undefined) token.bio = session.user.bio;
          if (session.user.rank !== undefined) token.rank = session.user.rank;
          if (session.user.role !== undefined) token.role = session.user.role;
          // Update other fields if necessary
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.email = token.email
        session.user.role = token.role
        session.user.avatar = token.avatar
        session.user.banner = token.banner
        session.user.bio = token.bio
        session.user.rank = token.rank
        session.user.role = token.role
        session.user.apiToken = token.apiToken
      }
      return session
    }
  },
  pages: {
    signIn: '/auth'
  },
  session: {
    strategy: 'jwt'
  }
})

export { handler as GET, handler as POST }
