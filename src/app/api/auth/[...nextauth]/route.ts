import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SUPER_ROLES } from "@/lib/permissions"
import { findStoreByInvite, hashInviteToken, MIN_PASSWORD_LENGTH } from "@/lib/merchantAuth"

async function resolvePermissions(role: string): Promise<string[]> {
  if (SUPER_ROLES.includes(role)) return ["*"]
  try {
    const r = await prisma.role.findUnique({ where: { name: role } })
    return Array.isArray(r?.permissions) ? (r!.permissions as string[]) : []
  } catch {
    return ["*"] // en cas d'erreur DB, on ne bloque pas
  }
}

/** Session marchand : limitée à SA boutique (rôle "merchant" + storeId), aucune permission admin. */
function merchantUser(store: { id: string; name: string; email: string }) {
  return { id: store.id, name: store.name, email: store.email, role: "merchant", storeId: store.id, permissions: [] as string[] }
}

const handler = NextAuth({
  providers: [
    // Espace marchand : e-mail de la boutique + mot de passe défini via le lien d'invitation
    CredentialsProvider({
      id: "merchant",
      name: "Marchand",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        if (!email || !credentials?.password) return null
        const store = await prisma.store.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { id: true, name: true, email: true, status: true, password: true },
        })
        if (!store?.password || store.status !== "Active") return null
        if (!(await bcrypt.compare(credentials.password, store.password))) return null
        await prisma.store.update({ where: { id: store.id }, data: { lastLoginAt: new Date() } })
        return merchantUser(store)
      },
    }),
    // Première connexion (ou réinitialisation) : jeton d'invitation à usage unique + nouveau mot de passe
    CredentialsProvider({
      id: "merchant-invite",
      name: "Invitation marchand",
      credentials: {
        token: { label: "Token", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const password = credentials?.password ?? ""
        if (!credentials?.token || password.length < MIN_PASSWORD_LENGTH) return null
        const store = await findStoreByInvite(credentials.token)
        if (!store) return null
        // Consommation atomique : un second usage concurrent du même jeton échoue (count = 0)
        const { count } = await prisma.store.updateMany({
          where: { id: store.id, inviteTokenHash: hashInviteToken(credentials.token) },
          data: {
            password: await bcrypt.hash(password, 12),
            inviteTokenHash: null,
            inviteExpiresAt: null,
            lastLoginAt: new Date(),
          },
        })
        if (count !== 1) return null
        return merchantUser(store)
      },
    }),
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
    async jwt({ token, user, trigger, session }) {
      // Profil modifié (page Mon profil) : met à jour nom / e-mail affichés sans reconnexion
      if (trigger === "update" && session) {
        const s = session as { name?: string; email?: string }
        if (typeof s.name === "string") token.name = s.name
        if (typeof s.email === "string") token.email = s.email
      }
      if (user) {
        token.role = user.role
        token.permissions = (user as { permissions?: string[] }).permissions ?? []
        token.storeId = user.storeId
        token.loginAt = Date.now()
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.storeId = token.storeId
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
