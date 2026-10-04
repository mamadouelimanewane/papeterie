import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/**
 * Rapports calculés à partir des vraies données (commandes, transactions, portefeuilles).
 * Filtres communs : ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
type Params = { params: Promise<{ kind: string }> }
const DONE = ["Delivered", "Completed"]
const CREDIT = ["Crédit", "Credit", "Recharge", "Remboursement", "Bonus"]

function range(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const from = sp.get("from"), to = sp.get("to")
  const createdAt: Record<string, Date> = {}
  if (from) createdAt.gte = new Date(`${from}T00:00:00`)
  if (to) createdAt.lte = new Date(`${to}T23:59:59`)
  return Object.keys(createdAt).length ? { createdAt } : {}
}
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
function lastMonths(n: number) {
  const out: string[] = []
  const d = new Date(); d.setDate(1)
  for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(monthKey(x)) }
  return out
}
const isCredit = (type: string) => CREDIT.some((c) => type.toLowerCase().startsWith(c.toLowerCase()))

export async function GET(req: NextRequest, { params }: Params) {
  const { kind } = await params
  const auth = await requireAdmin(req, "reports.view")
  if (isResponse(auth)) return auth
  const where = range(req)
  try {
    switch (kind) {
      /* ── Revenus par commande ── */
      case "earnings": {
        const setting = await prisma.appSetting.findUnique({ where: { key: "general" } })
        const pct = Number((setting?.value as { commissionPct?: number } | null)?.commissionPct ?? 10)
        const orders = await prisma.order.findMany({
          where, orderBy: { createdAt: "desc" }, take: 2000,
          include: { store: { select: { name: true, serviceArea: true } }, driver: { select: { name: true } } },
        })
        const userIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))] as string[]
        const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
        const uname = new Map(users.map((u) => [u.id, u.name]))
        const rows = orders.map((o) => {
          const items = Array.isArray(o.items) ? (o.items as { name?: string; qty?: number }[]) : []
          const cancelled = o.status === "Cancelled"
          const platform = cancelled ? 0 : o.earning > 0 ? o.earning : Math.round((o.subtotal || o.total) * pct / 100)
          return {
            id: o.id, orderId: o.orderId, store: o.store?.name ?? "—", area: o.store?.serviceArea ?? "—",
            user: (o.userId && uname.get(o.userId)) || o.notes?.match(/Client:\s*([^|]+)/)?.[1]?.trim() || "Invité",
            driver: o.driver?.name ?? "—",
            product: items.map((i) => i.name).filter(Boolean).join(", "),
            items: items.reduce((s, i) => s + (i.qty ?? 1), 0),
            subtotal: o.subtotal, deliveryFee: o.deliveryFee, total: o.total,
            payment: o.paymentMethod, paymentStatus: o.paymentStatus,
            platformEarning: platform, storeEarning: cancelled ? 0 : Math.max(0, (o.subtotal || o.total) - platform),
            status: o.status, date: o.createdAt,
          }
        })
        const months = lastMonths(7)
        const monthly = months.map((m) => ({
          month: m, earning: rows.filter((r) => monthKey(new Date(r.date)) === m).reduce((s, r) => s + r.platformEarning, 0),
        }))
        return NextResponse.json({ rows, monthly, commissionPct: pct })
      }

      /* ── Gains livreurs / boutiques ── */
      case "driver-earnings":
      case "store-earnings": {
        const byDriver = kind === "driver-earnings"
        const orders = await prisma.order.findMany({
          where: { ...where, status: { in: DONE }, ...(byDriver ? { driverId: { not: null } } : {}) },
          include: { driver: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
        })
        const agg = new Map<string, { id: string; name: string; orders: number; earning: number }>()
        for (const o of orders) {
          const who = byDriver ? o.driver : o.store
          if (!who) continue
          const earning = byDriver ? o.deliveryFee : Math.max(0, (o.subtotal || o.total) - o.earning)
          const cur = agg.get(who.id) ?? { id: who.id, name: who.name, orders: 0, earning: 0 }
          cur.orders += 1; cur.earning += earning
          agg.set(who.id, cur)
        }
        // Inclut aussi les livreurs / boutiques sans livraison sur la période
        const all = byDriver
          ? await prisma.driver.findMany({ where: { approvalStatus: "Approved" }, select: { id: true, name: true } })
          : await prisma.store.findMany({ select: { id: true, name: true } })
        for (const a of all) if (!agg.has(a.id)) agg.set(a.id, { ...a, orders: 0, earning: 0 })
        const rows = [...agg.values()].sort((a, b) => b.earning - a.earning)
        const monthly = lastMonths(6).map((m) => ({
          month: m,
          earning: orders.filter((o) => monthKey(o.createdAt) === m)
            .reduce((s, o) => s + (byDriver ? o.deliveryFee : Math.max(0, (o.subtotal || o.total) - o.earning)), 0),
        }))
        return NextResponse.json({
          rows, monthly,
          totals: { earning: rows.reduce((s, r) => s + r.earning, 0), orders: orders.length, active: rows.filter((r) => r.orders > 0).length },
        })
      }

      /* ── Transactions (toutes / par type de compte) ── */
      case "transactions": {
        const party = req.nextUrl.searchParams.get("party") // user | driver | store | null
        const partyWhere = party === "user" ? { userId: { not: null } } : party === "driver" ? { driverId: { not: null } } : party === "store" ? { storeId: { not: null } } : {}
        const tx = await prisma.transaction.findMany({
          where: { ...where, ...partyWhere }, orderBy: { createdAt: "desc" }, take: 2000,
          include: { user: { select: { name: true, phone: true } }, driver: { select: { name: true, phone: true } } },
        })
        const storeIds = [...new Set(tx.map((t) => t.storeId).filter(Boolean))] as string[]
        const stores = await prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true, phone: true } })
        const sname = new Map(stores.map((s) => [s.id, s]))
        return NextResponse.json({
          rows: tx.map((t) => ({
            id: t.id, ref: t.receiptNo ?? t.id.slice(-8).toUpperCase(),
            party: t.user ? "Client" : t.driver ? "Livreur" : t.storeId ? "Boutique" : "—",
            name: t.user?.name ?? t.driver?.name ?? (t.storeId ? sname.get(t.storeId)?.name : null) ?? "—",
            phone: t.user?.phone ?? t.driver?.phone ?? (t.storeId ? sname.get(t.storeId)?.phone : null) ?? "",
            type: t.type, direction: isCredit(t.type) ? "Crédit" : "Débit",
            amount: t.amount, method: t.method, description: t.description ?? "", status: t.status, date: t.createdAt,
          })),
        })
      }

      /* ── Soldes des portefeuilles ── */
      case "balance": {
        const [users, drivers, tx] = await Promise.all([
          prisma.user.findMany({ select: { id: true, name: true, phone: true, walletMoney: true } }),
          prisma.driver.findMany({ select: { id: true, name: true, phone: true, walletMoney: true } }),
          prisma.transaction.findMany({ where: { ...where, status: "Completed" }, select: { userId: true, driverId: true, amount: true, type: true } }),
        ])
        const sums = (pred: (t: (typeof tx)[number]) => boolean) => {
          const f = tx.filter(pred)
          return { credits: f.filter((t) => isCredit(t.type)).reduce((s, t) => s + t.amount, 0), debits: f.filter((t) => !isCredit(t.type)).reduce((s, t) => s + t.amount, 0) }
        }
        const rows = [
          ...users.map((u) => ({ id: u.id, name: u.name, phone: u.phone, type: "Client", ...sums((t) => t.userId === u.id), balance: u.walletMoney })),
          ...drivers.map((d) => ({ id: d.id, name: d.name, phone: d.phone, type: "Livreur", ...sums((t) => t.driverId === d.id), balance: d.walletMoney })),
        ].filter((r) => r.balance !== 0 || r.credits || r.debits)
        return NextResponse.json({ rows })
      }

      /* ── Activité des livreurs (en ligne / livraisons) ── */
      case "driver-activity": {
        const drivers = await prisma.driver.findMany({
          where: { approvalStatus: "Approved" },
          select: { id: true, name: true, phone: true, vehicleType: true, serviceArea: true, status: true, updatedAt: true, lastLocation: true },
          orderBy: { name: "asc" },
        })
        const orders = await prisma.order.findMany({ where: { ...where, driverId: { not: null } }, select: { driverId: true, status: true, createdAt: true, updatedAt: true } })
        const rows = drivers.map((d) => {
          const mine = orders.filter((o) => o.driverId === d.id)
          const times = mine.map((o) => o.createdAt.getTime())
          return {
            ...d,
            deliveries: mine.filter((o) => DONE.includes(o.status)).length,
            inProgress: mine.filter((o) => !DONE.includes(o.status) && o.status !== "Cancelled").length,
            firstActivity: times.length ? new Date(Math.min(...times)) : null,
            lastActivity: mine.length ? new Date(Math.max(...mine.map((o) => o.updatedAt.getTime()))) : d.updatedAt,
          }
        })
        return NextResponse.json({ rows })
      }
    }
    return NextResponse.json({ error: "Rapport inconnu" }, { status: 404 })
  } catch (e) { return errorResponse(e) }
}
