import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Verifie la signature du webhook si VERSUS_WEBHOOK_SECRET est configure.
 * Accepte le secret via l'en-tete `x-versus-signature` ou `authorization: Bearer`.
 * Si aucun secret n'est configure, un avertissement est journalise (mode compat).
 */
function isSignatureValid(req: Request): boolean {
  const secret = process.env.VERSUS_WEBHOOK_SECRET
  if (!secret) {
    console.warn("[versus-webhook] VERSUS_WEBHOOK_SECRET non configure - webhook non authentifie")
    return true
  }
  const sig = req.headers.get("x-versus-signature")
  const auth = req.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null
  return sig === secret || bearer === secret
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

      let paymentStatus = "En attente"
      let orderStatus = "Pending"

      if (status === "COMPLETED") {
        paymentStatus = "Complete"
        orderStatus = "Confirme"
      } else if (status === "FAILED" || status === "REJECTED" || status === "CANCELLED") {
        paymentStatus = "Echoue"
        orderStatus = "Annule"
      }

      const existingOrder = await prisma.order.findUnique({
        where: { id: external_reference }
      });

      if (!existingOrder) {
        return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
      }

      const updatedOrder = await prisma.order.update({
        where: { id: external_reference },
        data: { paymentStatus, status: orderStatus, invoiceId: reference },
      })

      // Restauration du stock si la commande est annulée et ne l'était pas déjà
      if (orderStatus === "Annule" && existingOrder.status !== "Annule") {
        const items = Array.isArray(existingOrder.items) ? existingOrder.items : [];
        for (const item of items as any[]) {
          if (item.productId && item.quantity) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: Number(item.quantity) } }
            }).catch(e => console.error("[versus-webhook] Erreur restauration stock", e));
          }
        }
      }

      if (status === "COMPLETED") {
        await prisma.transaction.create({
          data: {
            amount: parseFloat(amount) || updatedOrder.total,
            type: "Paiement Commande",
            method: "Versus",
            status: "Completed",
            description: message || "Paiement via webhook Versus",
            receiptNo: reference,
            storeId: updatedOrder.storeId,
            userId: updatedOrder.userId,
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
