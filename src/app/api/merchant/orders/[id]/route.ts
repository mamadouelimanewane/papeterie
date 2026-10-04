import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/merchantAuth"
import { MERCHANT_ORDER_SELECT } from "@/lib/merchantApi"
import { isResponse, errorResponse } from "@/lib/adminAuth"

/**
 * Action du marchand sur UNE de ses commandes. Corps : { action: "cancel" }
 * Seule une commande encore « Pending » sans livreur peut être annulée (le stock est restitué).
 * Les autres transitions (acceptation, retrait avec OTP, livraison) restent au livreur.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const { action } = await req.json()
    if (action !== "cancel") return NextResponse.json({ error: "Action inconnue" }, { status: 400 })

    const updated = await prisma.$transaction(async (tx) => {
      // Garde atomique : boutique + statut vérifiés dans le même UPDATE
      const { count } = await tx.order.updateMany({
        where: { id, storeId: auth.storeId, status: "Pending", driverId: null },
        data: { status: "Cancelled" },
      })
      if (count !== 1) return null
      const order = await tx.order.findUnique({ where: { id }, select: { items: true } })
      const items = (Array.isArray(order?.items) ? order.items : []) as { productId?: string; quantity?: number }[]
      for (const item of items) {
        const q = Number(item?.quantity)
        if (item?.productId && q > 0) {
          await tx.product.updateMany({ where: { id: item.productId, storeId: auth.storeId }, data: { stock: { increment: q } } })
        }
      }
      return tx.order.findUnique({ where: { id }, select: MERCHANT_ORDER_SELECT })
    })
    if (!updated) {
      return NextResponse.json({ error: "Commande introuvable ou déjà prise en charge : annulation impossible" }, { status: 409 })
    }
    return NextResponse.json(updated)
  } catch (e) { return errorResponse(e) }
}
