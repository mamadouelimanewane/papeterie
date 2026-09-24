import { prisma } from "@/lib/prisma"

/**
 * Vérifie qu'un jeton mobile (déjà validé par jsonwebtoken) n'a pas été révoqué
 * par une « déconnexion forcée » depuis le back-office.
 */
export async function assertSessionActive(kind: "user" | "driver", decoded: { id: string; iat?: number }) {
  const row = kind === "user"
    ? await prisma.user.findUnique({ where: { id: decoded.id }, select: { sessionsRevokedAt: true } })
    : await prisma.driver.findUnique({ where: { id: decoded.id }, select: { sessionsRevokedAt: true } })
  if (!row) throw new Error("Compte introuvable")
  if (row.sessionsRevokedAt && (decoded.iat ?? 0) * 1000 < row.sessionsRevokedAt.getTime()) {
    throw new Error("Session expirée, veuillez vous reconnecter")
  }
}
