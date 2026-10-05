import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDriver, isDriverError } from "@/lib/driverAuth"
import { readDeliveryTag } from "@/lib/deliveryPricing"
import { customerFromNotes } from "@/lib/orderPayment"

const OPEN = ["Accepted", "Processing", "PickedUp", "Picked", "OnTheWay", "Delivering"]

/**
 * GET /api/driver/orders/active — les commandes EN COURS du livreur connecté (attribuées, pas encore livrées).
 * Renvoie ce qu'il faut pour livrer : boutique, adresse, position GPS et distance, nom et téléphone du client,
 * gain. Jamais les codes (ramassage / livraison) : ils sont remis par la boutique et par le client.
 */
export async function GET(req: Request) {
  const driver = await requireDriver(req)
  if (isDriverError(driver)) return driver
  try {
    const orders = await prisma.order.findMany({
      where: { driverId: driver.id, status: { in: OPEN } },
      orderBy: { updatedAt: "desc" },
      omit: { pickupOtp: true, deliveryOtp: true, signature: true },
      include: { store: { select: { name: true, address: true, phone: true } } },
    })
    const userIds = [...new Set(orders.map((o) => o.userId).filter((v): v is string => !!v))]
    const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, phone: true } }) : []
    const byId = new Map(users.map((u) => [u.id, u]))

    return NextResponse.json(orders.map((o) => {
      const account = o.userId ? byId.get(o.userId) : undefined
      const guest = customerFromNotes(o.notes)
      const { distanceKm, point } = readDeliveryTag(o.notes)
      const items = Array.isArray(o.items) ? (o.items as { name?: string; quantity?: number; qty?: number }[]) : []
      return {
        id: o.orderId,
        _id: o.id,
        status: o.status,
        storeName: o.store?.name ?? "Boutique",
        storeAddress: o.store?.address ?? "Dakar",
        storePhone: o.store?.phone ?? "",
        deliveryAddress: o.address ?? "",
        deliveryGps: point,
        distanceKm,
        customerName: account?.name || (/Client:/.test(o.notes ?? "") ? `${guest.firstName} ${guest.lastName === "Schoolmatik" ? "" : guest.lastName}`.trim() : "Client"),
        customerPhone: account?.phone || guest.phone || "",
        items: items.map((i) => ({ name: i.name ?? "Article", quantity: i.quantity ?? i.qty ?? 1 })),
        total: o.total,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        // espèces à encaisser auprès du client à la livraison (0 si déjà payée en ligne)
        cashToCollect: o.paymentMethod === "Cash" ? o.total : 0,
        earnings: o.deliveryFee,
      }
    }))
  } catch (error) {
    console.error("[driver-orders-active]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
