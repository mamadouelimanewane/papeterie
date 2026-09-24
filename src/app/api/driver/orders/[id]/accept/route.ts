import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDriver, isDriverError } from "@/lib/driverAuth"

/**
 * POST /api/driver/orders/[id]/accept → un livreur approuvé accepte une commande libre.
 * Attribution atomique : si deux livreurs acceptent en même temps, un seul l'obtient.
 * Le code de ramassage est généré ici mais n'est PAS renvoyé au livreur : c'est la boutique qui le lui donne.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const driver = await requireDriver(req)
  if (isDriverError(driver)) return driver
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    const order = await prisma.order.findFirst({ where: { OR: [{ orderId: id }, { id }] }, select: { id: true } })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const { count } = await prisma.order.updateMany({
      where: { id: order.id, status: "Pending", driverId: null },
      data: { status: "Accepted", driverId: driver.id, pickupOtp },
    })
    if (count === 0) return NextResponse.json({ error: "Commande déjà prise par un autre livreur ou plus disponible" }, { status: 409 })

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      omit: { pickupOtp: true, deliveryOtp: true },
      include: { store: { select: { name: true, address: true, phone: true } } },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[driver-order-accept]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
