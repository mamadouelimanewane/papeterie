import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/** Déconnexion forcée d'un client ou d'un livreur sur ses applications. Corps : { party: "user" | "driver", id } */
export async function POST(req: NextRequest) {
  try {
    const { party, id } = await req.json()
    const auth = await requireAdmin(req, party === "driver" ? "drivers.manage" : "users.manage")
    if (isResponse(auth)) return auth
    if (!id || !["user", "driver"].includes(party)) return NextResponse.json({ error: "Compte invalide" }, { status: 400 })
    const data = { sessionsRevokedAt: new Date() }
    if (party === "user") await prisma.user.update({ where: { id }, data })
    else await prisma.driver.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (e) { return errorResponse(e) }
}
