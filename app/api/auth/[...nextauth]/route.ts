import { getAuthOptions } from '@/lib/auth'
import NextAuth from 'next-auth'

const { handlers } = await NextAuth({
  ...getAuthOptions(),
})

export const { GET, POST } = handlers
