import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDriver, isDriverError } from "@/lib/driverAuth"

/** Statuts qu'un livreur peut poser sur SA commande. */
const ALLOWED_STATUSES = new Set(["PickedUp", "Picked", "OnTheWay", "Delivering", "Delivered"])

/**
 * PUT /api/driver/orders/[id]/status { status, otp? }
 * - uniquement le livreur à qui la commande est attribuée ;
 * - « récupérée » exige le code de ramassage (donné par la boutique) ;
 * - « livrée » exige le code de livraison (donné par le client).
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const driver = await requireDriver(req)
  if (isDriverError(driver)) return driver
  try {
    const { id } = await params
    const { status, otp } = await req.json().catch(() => ({}))
    if (!status || !ALLOWED_STATUSES.has(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 })

    const order = await prisma.order.findFirst({ where: { OR: [{ id }, { orderId: id }] } })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    if (order.driverId !== driver.id) return NextResponse.json({ error: "Commande non attribuée à ce livreur" }, { status: 403 })
    if (["Delivered", "Completed", "Cancelled"].includes(order.status)) return NextResponse.json({ error: "Commande déjà clôturée" }, { status: 409 })

    if ((status === "PickedUp" || status === "Picked") && order.pickupOtp && String(otp ?? "") !== order.pickupOtp) {
      return NextResponse.json({ error: otp ? "Code de ramassage incorrect" : "Code de ramassage requis (demandez-le à la boutique)" }, { status: 400 })
    }
    if (status === "Delivered" && String(otp ?? "") !== order.deliveryOtp) {
      return NextResponse.json({ error: otp ? "Code de livraison incorrect" : "Code de livraison requis (demandez-le au client)" }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      omit: { pickupOtp: true, deliveryOtp: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[driver-order-status]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
