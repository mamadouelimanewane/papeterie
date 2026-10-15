import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma"

/**
 * Invitations personnelles des clients : un lien court /i/<code> qui ouvre la page d'installation de l'application
 * et pré-remplit le nom et le téléphone du client dans la vitrine.
 * Le lien ne connecte PAS au compte : il ne révèle que le prénom, le nom et le téléphone du client invité.
 * Le code est donc conservé tel quel, pour pouvoir réafficher ou réexporter le lien à tout moment.
 *
 * Stockage : table générique AdminRecord (collection « client-invite »), sans migration de schéma.
 */
export const INVITE_COLLECTION = "client-invite"
export const CLIENT_INVITE_TTL_MS = 180 * 86400_000

export type ClientInviteData = {
  code: string
  userId: string
  name: string
  phone: string
  createdBy: string
  expiresAt: string
  openedAt: string | null
  installedAt: string | null
}

/** Code aléatoire de 96 bits (16 caractères) : assez court pour un SMS ou WhatsApp. */
export const newClientInviteCode = () => randomBytes(12).toString("base64url")

/** Invitation encore valide correspondant à un code (ou null). */
export async function findClientInvite(code: string) {
  if (!/^[A-Za-z0-9_-]{16}$/.test(code)) return null
  const rec = await prisma.adminRecord.findFirst({
    where: { collection: INVITE_COLLECTION, data: { path: ["code"], equals: code } },
  })
  if (!rec) return null
  const data = rec.data as ClientInviteData
  if (new Date(data.expiresAt).getTime() < Date.now()) return null
  return { id: rec.id, data }
}

/** Adresse publique de l'application (liens envoyés aux clients). */
export function appOrigin(fallback: string) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || fallback
}

/** « Awa Diop » -> { firstName: "Awa", lastName: "Diop" } (format du profil de la vitrine). */
export function splitName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/).filter(Boolean)
  return { firstName: first ?? "", lastName: rest.join(" ") }
}

/** Téléphone au format de la vitrine : 9 chiffres (indicatif +221 retiré). */
export function localPhone(raw: string | null | undefined) {
  let d = (raw ?? "").replace(/[\s.\-()]/g, "")
  if (d.startsWith("+221")) d = d.slice(4)
  else if (d.startsWith("00221")) d = d.slice(5)
  else if (d.startsWith("221") && d.length === 12) d = d.slice(3)
  return /^\d{9}$/.test(d) ? d : ""
}
