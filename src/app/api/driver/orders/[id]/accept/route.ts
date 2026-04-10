import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

export async function POST(req: Request, context: any) {
  try {
    const { params } = context
    const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "papeterie-secret-2024-neon-pg"

    // Recuperer le driverId depuis le token JWT
    let driverDbId: string | null = null
    const authHeader = req.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decoded = verify(authHeader.split(" ")[1], JWT_SECRET) as { id: string }
        driverDbId = decoded.id
      } catch {}
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ orderId: params.id }, { id: params.id }] },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "Processing", driverId: driverDbId },
    })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}