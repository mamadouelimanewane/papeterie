import { createHash, randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

/** Durée de validité d'un lien d'invitation marchand. */
export const INVITE_TTL_MS = 72 * 3600 * 1000
export const MIN_PASSWORD_LENGTH = 8

export const hashInviteToken = (token: string) => createHash("sha256").update(token).digest("hex")

/** Jeton d'invitation aléatoire (256 bits) : seul son hash est stocké en base. */
export function newInviteToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashInviteToken(token), expiresAt: new Date(Date.now() + INVITE_TTL_MS) }
}

/** Boutique rattachée à un jeton d'invitation encore valide (ou null). */
export async function findStoreByInvite(token: string) {
  if (!token || token.length < 20 || token.length > 100) return null
  const store = await prisma.store.findUnique({
    where: { inviteTokenHash: hashInviteToken(token) },
    select: { id: true, name: true, email: true, status: true, inviteExpiresAt: true },
  })
  if (!store || store.status !== "Active" || !store.inviteExpiresAt || store.inviteExpiresAt < new Date()) return null
  return store
}

export type MerchantContext = { storeId: string; store: { id: string; name: string; email: string } }

/**
 * Vérifie la session marchand (cookie NextAuth, rôle "merchant") et renvoie SA boutique.
 * Toutes les routes /api/merchant/* filtrent ensuite leurs données par ce storeId,
 * jamais par un identifiant fourni par le client.
 */
export async function requireMerchant(req: NextRequest): Promise<MerchantContext | NextResponse> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== "merchant" || !token.storeId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }
  const store = await prisma.store.findUnique({
    where: { id: token.storeId },
    select: { id: true, name: true, email: true, status: true, sessionsRevokedAt: true },
  })
  // `loginAt` (posé à la connexion) et non `iat`, que NextAuth renouvelle à chaque rafraîchissement du cookie
  const loginAt = typeof token.loginAt === "number" ? token.loginAt : 0
  if (
    !store ||
    store.status !== "Active" ||
    (store.sessionsRevokedAt && loginAt < store.sessionsRevokedAt.getTime())
  ) {
    return NextResponse.json({ error: "Session expirée, reconnectez-vous" }, { status: 401 })
  }
  return { storeId: store.id, store: { id: store.id, name: store.name, email: store.email } }
}
