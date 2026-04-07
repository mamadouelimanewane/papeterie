import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "papeterie-secret-2024-neon-pg"

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verify(token, JWT_SECRET) as { id: string }

    const orders = await prisma.order.findMany({
      where: {
        driverId: decoded.id,
        status: { in: ["Delivered", "Cancelled"] }
      },
      include: {
        store: { select: { name: true, address: true } }
      },
      orderBy: { updatedAt: "desc" }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("[driver-orders-history-get]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
