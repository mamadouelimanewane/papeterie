import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PAID_STATUSES } from "@/lib/orderPayment"

/**
 * Suivi public d'une commande par son numéro (page de retour de paiement, « Mes commandes » de la vitrine).
 * Ne renvoie AUCUNE donnée personnelle : seulement statuts, montant et moyen de paiement.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")?.trim()
  if (!orderId || !/^[A-Z0-9-]{4,60}$/i.test(orderId)) {
    return NextResponse.json({ error: "Numéro de commande invalide" }, { status: 400 })
  }
  try {
    const o = await prisma.order.findUnique({
      where: { orderId },
      select: { orderId: true, status: true, paymentStatus: true, paymentMethod: true, total: true, createdAt: true },
    })
    if (!o) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    return NextResponse.json({ ...o, paid: PAID_STATUSES.includes(o.paymentStatus) })
  } catch (e) {
    console.error("[shop/order-status]", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
