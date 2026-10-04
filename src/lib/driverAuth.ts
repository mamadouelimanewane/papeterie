import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { assertSessionActive } from "@/lib/mobileSession"

/**
 * Livreur authentifié (JWT Bearer de l'application livreur), APPROUVÉ et non révoqué.
 * Renvoie l'id du livreur, ou une réponse 401/403 à retourner telle quelle.
 */
export async function requireDriver(req: Request): Promise<{ id: string } | NextResponse> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  let id: string
  try {
    const decoded = verify(auth.slice(7), process.env.NEXTAUTH_SECRET as string) as { id: string; iat?: number; driverId?: number }
    if (decoded.driverId === undefined) throw new Error("jeton non livreur")
    await assertSessionActive("driver", decoded)
    id = decoded.id
  } catch {
    return NextResponse.json({ error: "Session invalide, reconnectez-vous" }, { status: 401 })
  }
  const d = await prisma.driver.findUnique({ where: { id }, select: { approvalStatus: true } })
  if (d?.approvalStatus !== "Approved") return NextResponse.json({ error: "Compte livreur non approuvé" }, { status: 403 })
  return { id }
}

export const isDriverError = (x: unknown): x is NextResponse => x instanceof NextResponse
