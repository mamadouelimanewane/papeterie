import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString =
  process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL ?? ""

const adapter = new PrismaPg({ connectionString })

function createClient() {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Secrets et métadonnées de l'espace marchand : jamais renvoyés par défaut (plusieurs routes publiques
    // incluent `store: true`). Les lire exige un `select` explicite.
    omit: {
      store: { password: true, inviteTokenHash: true, inviteExpiresAt: true, sessionsRevokedAt: true, lastLoginAt: true },
    },
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
