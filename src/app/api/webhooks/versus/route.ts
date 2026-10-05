import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { safeEqual } from "@/lib/auth"
import { PAID_STATUSES } from "@/lib/orderPayment"

/**
 * Verifie le secret du webhook (VERSUS_WEBHOOK_SECRET), obligatoire.
 * Accepte le secret via l'en-tete `x-versus-signature` ou `authorization: Bearer`.
 * Sans secret configure, tout est refuse (echec ferme).
 */
function isSignatureValid(req: Request): boolean {
  const secret = process.env.VERSUS_WEBHOOK_SECRET
  if (!secret) {
    console.error("[versus-webhook] VERSUS_WEBHOOK_SECRET non configure - webhook refuse")
    return false
  }
  const auth = req.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null
  return safeEqual(req.headers.get("x-versus-signature"), secret) || safeEqual(bearer, secret)
}

export async function POST(req: Request) {
  try {
    if (!isSignatureValid(req)) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 })
    }

    const body = await req.json()

    // Cas 1 : Reception des instructions de paiement
    if (body.type === "PAYMENT_INSTRUCTIONS") {
      console.log("[versus-webhook] Instructions de paiement recues")
      return NextResponse.json({ success: true, message: "Webhook recu" }, { status: 200 })
    }

    // Cas 2 : Statut de la transaction
    if (body.type === "TRANSACTION_STATUS") {
      const { external_reference, status, message, amount, reference } = body

      if (!external_reference) {
        return NextResponse.json({ error: "external_reference manquant" }, { status: 400 })
      }

      const existingOrder = await prisma.order.findUnique({ where: { id: external_reference } })
      if (!existingOrder) {
        return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
      }

      // Une commande deja reglee ne change plus : un avis rejoue ou en retard (ex. FAILED apres COMPLETED)
      // ne doit ni annuler une commande payee, ni la faire revenir en arriere, ni doubler l'encaissement.
      if (PAID_STATUSES.includes(existingOrder.paymentStatus)) {
        return NextResponse.json({ success: true, message: "Commande deja reglee, avis ignore" }, { status: 200 })
      }

      let paymentStatus = "En attente"
      let orderStatus = existingOrder.status
      const paidAmount = parseFloat(amount)
      if (status === "COMPLETED") {
        if (Number.isFinite(paidAmount) && paidAmount + 1 < existingOrder.total) {
          // Montant recu inferieur au total : pas de confirmation automatique, a traiter a la main
          paymentStatus = "Partiel"
          console.error("[versus-webhook] montant insuffisant", { order: existingOrder.orderId, paid: paidAmount, total: existingOrder.total })
        } else {
          paymentStatus = "Complete"
          // Le paiement est suivi par paymentStatus ; le statut de livraison reste « Pending » pour que
          // la commande apparaisse aux livreurs (un statut « Confirme » la rendait invisible et inacceptable).
        }
      } else if (status === "FAILED" || status === "REJECTED" || status === "CANCELLED") {
        paymentStatus = "Echoue"
        if (existingOrder.status === "Pending") orderStatus = "Annule"
      }

      // Mise a jour conditionnelle et atomique : deux avis simultanes ne passent pas tous les deux
      const { count } = await prisma.order.updateMany({
        where: { id: external_reference, paymentStatus: { notIn: PAID_STATUSES } },
        data: { paymentStatus, status: orderStatus, invoiceId: reference ?? existingOrder.invoiceId },
      })
      if (count === 0) {
        return NextResponse.json({ success: true, message: "Commande deja reglee, avis ignore" }, { status: 200 })
      }

      // Restauration du stock si la commande vient d'etre annulee
      if (orderStatus === "Annule" && existingOrder.status !== "Annule") {
        const items = Array.isArray(existingOrder.items) ? existingOrder.items : []
        for (const item of items as { productId?: string; quantity?: number }[]) {
          if (item.productId && item.quantity) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: Number(item.quantity) } },
            }).catch((e) => console.error("[versus-webhook] Erreur restauration stock", e))
          }
        }
      }

      if (paymentStatus === "Complete") {
        await prisma.transaction.create({
          data: {
            amount: Number.isFinite(paidAmount) ? paidAmount : existingOrder.total,
            type: "Paiement Commande",
            method: "Versus",
            status: "Completed",
            description: message || "Paiement via webhook Versus",
            receiptNo: reference,
            storeId: existingOrder.storeId,
            userId: existingOrder.userId,
          },
        })
      }

      return NextResponse.json({ success: true, message: "Commande mise a jour" }, { status: 200 })
    }

    return NextResponse.json({ success: true, message: "Type de webhook ignore" }, { status: 200 })
  } catch (error) {
    console.error("[versus-webhook]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
