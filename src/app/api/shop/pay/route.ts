import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PAID_STATUSES, startOrderPayment } from "@/lib/orderPayment"

/**
 * Relance le paiement en ligne (Versus : Wave, Orange Money, carte) d'une commande non réglée.
 * Corps : { orderId }. Renvoie { link } vers la page de paiement.
 * Sans risque pour le client : on ne peut que PAYER la commande, jamais la modifier.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json().catch(() => ({}))
    if (typeof orderId !== "string" || !/^[A-Z0-9-]{4,60}$/i.test(orderId)) {
      return NextResponse.json({ error: "Numéro de commande invalide" }, { status: 400 })
    }
    const order = await prisma.order.findUnique({
      where: { orderId },
      select: { id: true, orderId: true, total: true, notes: true, status: true, paymentStatus: true },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    if (PAID_STATUSES.includes(order.paymentStatus)) return NextResponse.json({ error: "Cette commande est déjà payée" }, { status: 409 })
    if (order.status === "Cancelled") return NextResponse.json({ error: "Cette commande a été annulée" }, { status: 409 })
    if (!(order.total > 0)) return NextResponse.json({ error: "Montant de commande invalide" }, { status: 400 })

    const r = await startOrderPayment(order, req.headers.get("host") ?? "papeterie.vercel.app")
    if (!r.ok || !r.link) return NextResponse.json({ error: r.ok ? "Lien de paiement indisponible" : r.error }, { status: 502 })

    // La commande passe en paiement en ligne (utile si elle était prévue à la livraison)
    await prisma.order.update({ where: { id: order.id }, data: { paymentMethod: "Versus" } })
    return NextResponse.json({ link: r.link })
  } catch (e) {
    console.error("[shop/pay]", e)
    return NextResponse.json({ error: "Paiement momentanément indisponible, réessayez" }, { status: 500 })
  }
}
