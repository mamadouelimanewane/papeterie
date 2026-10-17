import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { PAID_STATUSES } from "@/lib/orderPayment"

/**
 * Historique d'un client pour sa fiche : ses commandes (compte, ou commandes invité passées avec
 * le même numéro de téléphone) et les totaux (dépensé, en cours, remboursé).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req, "orders.view")
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, phone: true } })
    if (!user) return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
    // Numéro sénégalais : 9 derniers chiffres (771234567), écrits sans espaces dans « Tél: … » des commandes invité
    const digits = (user.phone ?? "").replace(/\D/g, "").slice(-9)
    const orders = await prisma.order.findMany({
      where: { OR: [{ userId: user.id }, ...(digits.length === 9 ? [{ notes: { contains: digits } }] : [])] },
      select: { id: true, orderId: true, total: true, status: true, paymentStatus: true, paymentMethod: true, createdAt: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    const paid = orders.filter((o) => PAID_STATUSES.includes(o.paymentStatus))
    const summary = {
      count: orders.length,
      paidCount: paid.length,
      spent: paid.reduce((s, o) => s + o.total, 0),
      refunded: orders.filter((o) => o.paymentStatus === "Rembourse").reduce((s, o) => s + o.total, 0),
      toRefund: orders.filter((o) => o.paymentStatus === "A rembourser").length,
      lastOrder: orders[0]?.createdAt ?? null,
    }
    const list = orders.map(({ items, ...o }) => ({ ...o, articles: Array.isArray(items) ? items.length : 0 }))
    return NextResponse.json({ summary, orders: list })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[user-orders]") }
}
