import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertSessionActive } from "@/lib/mobileSession"
import { verify } from "jsonwebtoken"

const JWT_SECRET = (process.env.NEXTAUTH_SECRET as string)

const ALLOWED_STATUSES = new Set([
  "Accepted", "Picked", "PickedUp", "OnTheWay", "Delivering", "Delivered", "Completed", "Cancelled",
])

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Auth livreur (JWT Bearer)
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }
    let driverId: string
    try {
      const decoded = verify(authHeader.split(" ")[1], JWT_SECRET) as { id: string }
      await assertSessionActive("driver", decoded)
      driverId = decoded.id
    } catch {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    const { id } = await params
    const { status } = await req.json()
    if (!status || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    // Le livreur ne peut modifier que ses propres commandes
    if (order.driverId && order.driverId !== driverId) {
      return NextResponse.json({ error: "Commande non assignee a ce livreur" }, { status: 403 })
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status, ...(order.driverId ? {} : { driverId }) },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[driver-order-status]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
