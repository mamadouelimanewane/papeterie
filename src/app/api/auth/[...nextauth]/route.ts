import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SUPER_ROLES } from "@/lib/permissions"

async function resolvePermissions(role: string): Promise<string[]> {
  if (SUPER_ROLES.includes(role)) return ["*"]
  try {
    const r = await prisma.role.findUnique({ where: { name: role } })
    return Array.isArray(r?.permissions) ? (r!.permissions as string[]) : []
  } catch {
    return ["*"] // en cas d'erreur DB, on ne bloque pas
  }
}

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
            return { id: "admin-env", name: "Admin", email: adminEmail, role: "admin", permissions: ["*"] }
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
          const permissions = await resolvePermissions(admin.role)
          return { id: admin.id, name: admin.name, email: admin.email, role: admin.role, permissions }
        } catch {
          // DB not yet configured — fall through
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.permissions = (user as { permissions?: string[] }).permissions ?? []
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        ;(session.user as { permissions?: string[] }).permissions = (token.permissions as string[]) ?? []
      }
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
