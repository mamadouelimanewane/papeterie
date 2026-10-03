import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hasAdminSession, verifyBearer } from "@/lib/auth"

const DRIVER_STATUSES = new Set(["Accepted", "Picked", "PickedUp", "OnTheWay", "Delivering", "Cancelled"])

// Mise a jour de statut : admin (session) ou livreur assigne (JWT). "Delivered" exige l'OTP
// via PATCH /api/orders/[id].
export async function PUT(req: Request) {
  try {
    const admin = await hasAdminSession()
    const bearer = verifyBearer(req)
    if (!admin && !bearer) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

    const { id, status } = await req.json()
    if (typeof id !== "string" || typeof status !== "string") {
      return NextResponse.json({ error: "id et status requis" }, { status: 400 })
    }
    const order = await prisma.order.findFirst({ where: { OR: [{ id }, { orderId: id }] } })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    if (!admin) {
      if (order.driverId !== bearer!.id) return NextResponse.json({ error: "Commande non assignee" }, { status: 403 })
      if (!DRIVER_STATUSES.has(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[orders-update]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
