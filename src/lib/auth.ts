import { verify } from "jsonwebtoken"
import { getServerSession } from "next-auth"
import { timingSafeEqual } from "crypto"

export type BearerPayload = { id: string; [k: string]: unknown }

/** Verifie le JWT Bearer (apps mobiles). Renvoie null si absent/invalide. */
export function verifyBearer(req: Request): BearerPayload | null {
  const secret = process.env.NEXTAUTH_SECRET
  const h = req.headers.get("authorization")
  if (!secret || !h?.startsWith("Bearer ")) return null
  try {
    const d = verify(h.slice(7).trim(), secret) as BearerPayload
    return d && typeof d.id === "string" ? d : null
  } catch {
    return null
  }
}

/** Vrai si une session admin NextAuth est active. */
export async function hasAdminSession(): Promise<boolean> {
  try {
    return !!(await getServerSession())
  } catch {
    return false
  }
}

/** Comparaison de secrets en temps constant. */
export function safeEqual(a: string | null | undefined, b: string): boolean {
  if (!a) return false
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
