import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/**
 * Adresses utilisées par un client (userId) ou livrées par un livreur (driverId),
 * reconstituées à partir des commandes : adresse, nombre de commandes, dernière utilisation.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, "users.view")
  if (isResponse(auth)) return auth
  try {
    const userId = req.nextUrl.searchParams.get("userId")
    const driverId = req.nextUrl.searchParams.get("driverId")
    if (!userId && !driverId) return NextResponse.json({ error: "userId ou driverId attendu" }, { status: 400 })
    const orders = await prisma.order.findMany({
      where: { ...(userId ? { userId } : { driverId: driverId! }), address: { not: null } },
      select: { address: true, createdAt: true }, orderBy: { createdAt: "desc" },
    })
    const map = new Map<string, { address: string; count: number; lastUsed: Date }>()
    for (const o of orders) {
      const a = o.address!.trim()
      if (!a) continue
      const cur = map.get(a.toLowerCase())
      if (cur) cur.count++
      else map.set(a.toLowerCase(), { address: a, count: 1, lastUsed: o.createdAt })
    }
    return NextResponse.json([...map.values()])
  } catch (e) { return errorResponse(e) }
}
