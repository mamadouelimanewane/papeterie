import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { REFUND_STATUS } from "@/lib/orderExpiry"
import { notifyOrderRefunded } from "@/lib/orderEmails"

export const runtime = "nodejs"

const METHODS = ["Wave", "Orange Money", "Free Money", "Espèces", "Virement", "Versus"]

/**
 * POST /api/admin/orders/[id]/refund { method, reference? }
 * Clôt une commande « A rembourser » (payée alors que le stock n'était plus disponible) :
 * trace du remboursement dans les transactions, statut « Rembourse », e-mail au client.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req, "orders.manage")
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const b = await req.json().catch(() => ({}))
    const method = typeof b.method === "string" && METHODS.includes(b.method) ? b.method : null
    if (!method) return NextResponse.json({ error: "Moyen de remboursement invalide" }, { status: 400 })
    const reference = typeof b.reference === "string" ? b.reference.trim().slice(0, 80) || null : null

    const order = await prisma.order.findUnique({ where: { id }, select: { id: true, orderId: true, total: true, storeId: true, userId: true } })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    // Atomique : deux clics simultanés ne créent pas deux remboursements
    const done = await prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({ where: { id, paymentStatus: REFUND_STATUS }, data: { paymentStatus: "Rembourse", status: "Annule" } })
      if (count === 0) return false
      await tx.transaction.create({
        data: {
          amount: order.total, type: "Remboursement", method, status: "Completed",
          description: `Remboursement de la commande ${order.orderId}`, receiptNo: reference,
          storeId: order.storeId, userId: order.userId,
        },
      })
      return true
    })
    if (!done) return NextResponse.json({ error: "Cette commande n'est pas à rembourser" }, { status: 409 })

    await notifyOrderRefunded(order.id)
    return NextResponse.json({ ok: true, paymentStatus: "Rembourse", status: "Annule" })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[order-refund]") }
}
