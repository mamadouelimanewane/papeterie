import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/merchantAuth"
import { isResponse, errorResponse } from "@/lib/adminAuth"

const CANCELLED = ["Cancelled", "Annule"]

/** Tableau de bord marchand : chiffres calculés sur les commandes de SA boutique uniquement. */
export async function GET(req: NextRequest) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const storeId = auth.storeId
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [store, byStatus, today, revenue, recent, lowStock, allItems] = await Promise.all([
      prisma.store.findUnique({ where: { id: storeId }, select: { walletMoney: true, rating: true } }),
      prisma.order.groupBy({ by: ["status"], where: { storeId }, _count: { _all: true } }),
      prisma.order.aggregate({
        where: { storeId, createdAt: { gte: startOfDay }, status: { notIn: CANCELLED } },
        _count: { _all: true }, _sum: { subtotal: true },
      }),
      prisma.order.aggregate({ where: { storeId, status: { notIn: CANCELLED } }, _sum: { subtotal: true, earning: true } }),
      prisma.order.findMany({
        where: { storeId }, orderBy: { createdAt: "desc" }, take: 6,
        select: { id: true, orderId: true, total: true, status: true, items: true, notes: true, createdAt: true },
      }),
      prisma.product.findMany({
        where: { storeId, status: "Active", stock: { lte: 5 } }, orderBy: { stock: "asc" }, take: 5,
        select: { id: true, name: true, stock: true },
      }),
      prisma.order.findMany({ where: { storeId, status: { notIn: CANCELLED } }, select: { items: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    ])

    // Top produits (sur les 500 dernières commandes non annulées)
    const top = new Map<string, { name: string; quantity: number; amount: number }>()
    for (const o of allItems) {
      for (const it of (Array.isArray(o.items) ? o.items : []) as { name?: string; price?: number; quantity?: number }[]) {
        const name = String(it?.name ?? "Article")
        const q = Number(it?.quantity) || 0
        const cur = top.get(name) ?? { name, quantity: 0, amount: 0 }
        cur.quantity += q
        cur.amount += q * (Number(it?.price) || 0)
        top.set(name, cur)
      }
    }

    return NextResponse.json({
      walletMoney: store?.walletMoney ?? 0,
      rating: store?.rating ?? 0,
      todayOrders: today._count._all,
      todayRevenue: today._sum.subtotal ?? 0,
      totalRevenue: revenue._sum.subtotal ?? 0,
      totalCommission: revenue._sum.earning ?? 0,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      recent,
      lowStock,
      topProducts: [...top.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    })
  } catch (e) { return errorResponse(e) }
}
