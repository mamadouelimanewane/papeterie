import { createHash, randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"

/** Liens « mot de passe oublié » du back-office : jeton aléatoire, seule son empreinte est stockée. */
const COLLECTION = "admin-reset"
const TTL_MS = 60 * 60_000 // 1 heure

const digest = (token: string) => createHash("sha256").update(token).digest("hex")

/** Crée un jeton pour cet administrateur (les précédents sont annulés) et le renvoie en clair. */
export async function createResetToken(adminId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  await prisma.adminRecord.deleteMany({ where: { collection: COLLECTION, data: { path: ["adminId"], equals: adminId } } })
  await prisma.adminRecord.create({
    data: { collection: COLLECTION, data: { adminId, hash: digest(token), expiresAt: Date.now() + TTL_MS } },
  })
  return token
}

/** Administrateur lié à un jeton valide (non expiré), sinon null. */
export async function adminIdForToken(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null
  const rec = await prisma.adminRecord.findFirst({ where: { collection: COLLECTION, data: { path: ["hash"], equals: digest(token) } } })
  const d = rec?.data as { adminId?: string; expiresAt?: number } | undefined
  if (!rec || !d?.adminId || !d.expiresAt || d.expiresAt < Date.now()) return null
  return d.adminId
}

/** Un lien ne sert qu'une fois : tous les jetons de l'administrateur sont supprimés. */
export async function consumeResetTokens(adminId: string) {
  await prisma.adminRecord.deleteMany({ where: { collection: COLLECTION, data: { path: ["adminId"], equals: adminId } } })
}
