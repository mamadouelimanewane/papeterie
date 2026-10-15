import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDriver, isDriverError } from "@/lib/driverAuth"
import { readDeliveryTag } from "@/lib/deliveryPricing"
import { deliverableWhere } from "@/lib/orderExpiry"
import { PAID_STATUSES } from "@/lib/orderPayment"

/**
 * Commandes en attente d'un livreur. Réservé aux livreurs approuvés.
 * Pas d'identité ni de téléphone du client avant acceptation : seulement de quoi décider (boutique, adresse, montant).
 */
export async function GET(req: Request) {
  const driver = await requireDriver(req)
  if (isDriverError(driver)) return driver
  try {
    const orders = await prisma.order.findMany({
      where: deliverableWhere(PAID_STATUSES),
      select: {
        id: true, orderId: true, address: true, items: true, total: true, deliveryFee: true, notes: true,
        store: { select: { name: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return NextResponse.json(orders.map((o) => ({
      id: o.orderId,
      _id: o.id,
      storeName: o.store?.name || "Boutique",
      storeAddress: o.store?.address || "Dakar",
      deliveryAddress: o.address || "Adresse communiquée après acceptation",
      items: Array.isArray(o.items) ? (o.items as unknown[]).length : 1,
      // distance boutique -> client enregistrée à la commande (calculée par le serveur) ; « — » si la commande n'a pas de position GPS
      distance: (() => { const d = readDeliveryTag(o.notes).distanceKm; return d === null ? "—" : `${String(d).replace(".", ",")} km` })(),
      earnings: o.deliveryFee || 500, // gain du livreur = frais de livraison
      total: o.total,
    })))
  } catch (error) {
    console.error("[driver-orders-available]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
