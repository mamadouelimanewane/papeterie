import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Check env-based super admin first (no DB required for initial setup)
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD

        if (adminEmail && adminPassword) {
          if (
            credentials.email === adminEmail &&
            credentials.password === adminPassword
          ) {
            return { id: "admin-env", name: "Admin", email: adminEmail, role: "admin" }
          }
        }

        // Check DB admins
        try {
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email },
          })
          if (!admin || admin.status !== "Active") return null
          const valid = await bcrypt.compare(credentials.password, admin.password)
          if (!valid) return null
          return { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
        } catch {
          // DB not yet configured — fall through
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
