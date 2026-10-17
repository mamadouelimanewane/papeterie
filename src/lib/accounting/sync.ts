import { prisma } from "@/lib/prisma"
import { PAID_STATUSES, customerFromNotes } from "@/lib/orderPayment"
import { getAccountingConfig, productVatRate, type AccountingConfig } from "./config"
import { ACC, treasuryFor } from "./chart"
import { AccountingError, balanceLines, createEntry, ensureChart, type LineInput } from "./ledger"

/**
 * Comptabilisation automatique des opérations de la boutique (idempotente : chaque opération
 * n'est passée qu'une fois, repérée par son origine sourceType + sourceId).
 *
 *  vente          VE  411 Client (TTC)  /  701 Ventes HT par taux, 706 Livraison HT, 443 TVA collectée
 *  encaissement   MM/CA/BQ  552 / 571 / 521  /  411 Client
 *  livreur        OD  6122 Transports sur ventes  /  4012 Livreurs
 *  retrait        MM/CA/BQ  4012 Livreurs (ou virement interne 521 / 552)  /  trésorerie
 *  remboursement  MM/CA/BQ  411 Client  /  trésorerie
 *  avoir          VE  contre-passation de la vente d'une commande annulée
 */

const DELIVERED = ["Delivered", "Completed"]
const CANCELLED = ["Cancelled", "Annule"]
const REFUND = ["A rembourser", "Rembourse"]

type Item = { productId?: string; name?: string; price?: number; quantity?: number; qty?: number; vatRate?: number; components?: { name: string; price: number; qty: number; vatRate?: number }[] }
type OrderRow = { id: string; orderId: string; total: number; subtotal: number; deliveryFee: number; earning: number; items: unknown; notes: string | null; userId: string | null; status: string; paymentStatus: string; paymentMethod: string; invoiceId: string | null; createdAt: Date; updatedAt: Date }

export type SyncReport = { created: number; byType: Record<string, number>; errors: string[]; manual: { date: Date; label: string; amount: number }[] }

const r = (n: number) => Math.round(n)

/** Ventilation TTC d'une commande par taux de TVA (articles après remise promo) et livraison. */
export async function saleBreakdown(o: OrderRow, cfg: AccountingConfig) {
  const items = (Array.isArray(o.items) ? o.items : []) as Item[]
  // Taux manquants (commandes antérieures à la TVA par produit) : relus sur le catalogue actuel
  const ids = items.map((i) => i.productId).filter(Boolean) as string[]
  const names = items.flatMap((i) => (i.components ?? []).filter((c) => c.vatRate === undefined).map((c) => c.name))
  const prods = ids.length || names.length
    ? await prisma.product.findMany({ where: { OR: [{ id: { in: ids } }, { name: { in: names } }] }, select: { id: true, name: true, category: true, vatRate: true } })
    : []
  const goods = new Map<number, number>()
  const add = (rate: number, ttc: number) => goods.set(rate, (goods.get(rate) ?? 0) + ttc)
  for (const i of items) {
    const qty = i.quantity ?? i.qty ?? 1
    const line = (i.price ?? 0) * qty
    if (i.components?.length) {
      const base = i.components.reduce((s, c) => s + c.price * c.qty, 0) || 1
      for (const c of i.components) {
        const rate = c.vatRate ?? productVatRate(prods.find((p) => p.name === c.name) ?? {}, cfg)
        add(rate, (line * c.price * c.qty) / base)
      }
    } else {
      add(i.vatRate ?? productVatRate(prods.find((p) => p.id === i.productId) ?? {}, cfg), line)
    }
  }
  const goodsTotal = [...goods.values()].reduce((s, v) => s + v, 0) || o.subtotal
  // Remise promo : écart entre (articles + livraison) et le total payé, répartie sur les articles
  const discount = Math.max(0, o.subtotal + o.deliveryFee - o.total)
  const factor = goodsTotal > 0 ? Math.max(0, goodsTotal - discount) / goodsTotal : 1
  const perRate = [...goods.entries()].map(([rate, ttc]) => ({ rate, ttc: r(ttc * factor) })).filter((x) => x.ttc > 0)
  return { perRate, delivery: { rate: cfg.deliveryVatRate, ttc: r(o.deliveryFee) }, total: r(o.total) }
}

const ht = (ttc: number, rate: number) => r((ttc * 100) / (100 + rate))

async function clientName(o: OrderRow) {
  if (o.userId) {
    const u = await prisma.user.findUnique({ where: { id: o.userId }, select: { name: true } })
    if (u?.name) return u.name
  }
  const g = customerFromNotes(o.notes)
  return `${g.firstName} ${g.lastName === "Schoolmatik" ? "" : g.lastName}`.trim()
}

/** Lignes de l'écriture de vente d'une commande. */
async function saleLines(o: OrderRow, cfg: AccountingConfig): Promise<LineInput[]> {
  const b = await saleBreakdown(o, cfg)
  const who = await clientName(o)
  const lines: LineInput[] = [{ account: ACC.client, debit: b.total, thirdParty: who, label: `Facture ${o.orderId}` }]
  const deliveryHt = ht(b.delivery.ttc, b.delivery.rate)
  if (cfg.mode === "commission") {
    // La plateforme ne vend que sa commission (et la livraison) ; la part des articles revient à la boutique
    const commTtc = r(Math.min(o.earning, b.total - b.delivery.ttc))
    const commHt = ht(commTtc, cfg.vatDefault)
    lines.push({ account: ACC.partnerStore, credit: b.total - b.delivery.ttc - commTtc, label: `Part boutique ${o.orderId}` })
    lines.push({ account: ACC.salesCommission, credit: commHt, vatRate: cfg.vatDefault, label: "Commission" })
    if (commTtc - commHt) lines.push({ account: ACC.vatServices, credit: commTtc - commHt, vatRate: cfg.vatDefault, label: `TVA ${cfg.vatDefault} % commission` })
  } else {
    for (const g of b.perRate) {
      const h = ht(g.ttc, g.rate)
      lines.push({ account: ACC.salesGoods, credit: h, vatRate: g.rate, label: g.rate ? `Ventes TVA ${g.rate} %` : "Ventes exonérées" })
      if (g.ttc - h) lines.push({ account: ACC.vatSales, credit: g.ttc - h, vatRate: g.rate, label: `TVA ${g.rate} % sur ventes` })
    }
  }
  if (b.delivery.ttc) {
    lines.push({ account: ACC.salesDelivery, credit: deliveryHt, vatRate: b.delivery.rate, label: "Livraison" })
    if (b.delivery.ttc - deliveryHt) lines.push({ account: ACC.vatServices, credit: b.delivery.ttc - deliveryHt, vatRate: b.delivery.rate, label: `TVA ${b.delivery.rate} % livraison` })
  }
  return balanceLines(lines)
}

let running: Promise<SyncReport> | null = null
let lastRun = 0

/** Synchronisation à la demande ; `throttleMs` évite de relancer à chaque affichage. */
export function syncAccounting(throttleMs = 0): Promise<SyncReport> {
  if (running) return running
  if (throttleMs && Date.now() - lastRun < throttleMs) return Promise.resolve({ created: 0, byType: {}, errors: [], manual: [] })
  running = doSync().finally(() => { running = null; lastRun = Date.now() })
  return running
}

async function doSync(): Promise<SyncReport> {
  await ensureChart()
  const cfg = await getAccountingConfig()
  const since = new Date(`${cfg.startDate}T00:00:00Z`)
  const report: SyncReport = { created: 0, byType: {}, errors: [], manual: [] }
  const done = new Set((await prisma.accEntry.findMany({ where: { sourceType: { not: null } }, select: { sourceType: true, sourceId: true } })).map((e) => `${e.sourceType}:${e.sourceId}`))
  const closed = new Set((await prisma.accFiscalYear.findMany({ where: { status: { not: "Ouvert" } }, select: { year: true } })).map((y) => y.year))
  const post = async (type: string, id: string, build: () => Promise<Parameters<typeof createEntry>[0] | null>) => {
    if (done.has(`${type}:${id}`)) return
    try {
      const e = await build()
      if (!e || closed.has(e.date.getUTCFullYear())) return
      await createEntry({ ...e, sourceType: type, sourceId: id, createdBy: "auto" })
      done.add(`${type}:${id}`)
      report.created++
      report.byType[type] = (report.byType[type] ?? 0) + 1
    } catch (err) {
      report.errors.push(`${type} ${id} : ${err instanceof AccountingError ? err.message : String(err)}`)
    }
  }

  const orders = (await prisma.order.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "asc" } })) as OrderRow[]
  const payments = await prisma.transaction.findMany({ where: { type: "Paiement Commande", status: "Completed", createdAt: { gte: since } }, orderBy: { createdAt: "asc" } })
  const payOf = (o: OrderRow) => payments.find((p) => p.receiptNo && p.receiptNo === o.invoiceId)

  for (const o of orders) {
    const pay = payOf(o)
    const paid = PAID_STATUSES.includes(o.paymentStatus)
    // 1. Vente : commande payée ou livrée
    if (paid || DELIVERED.includes(o.status)) {
      await post("vente", o.id, async () => ({ journal: "VE", date: pay?.createdAt ?? o.updatedAt, label: `Vente ${o.orderId}`, reference: o.orderId, lines: await saleLines(o, cfg) }))
    }
    // 2. Encaissement sans transaction de paiement en ligne (espèces, saisie manuelle, paiement reçu sur commande à rembourser)
    if (!pay && (paid || REFUND.includes(o.paymentStatus))) {
      const t = treasuryFor(REFUND.includes(o.paymentStatus) ? "Versus" : o.paymentMethod)
      await post("encaissement-cmd", o.id, async () => ({
        journal: t.journal, date: REFUND.includes(o.paymentStatus) ? o.createdAt : o.updatedAt, label: `Encaissement ${o.orderId} (${o.paymentMethod})`, reference: o.orderId,
        lines: [{ account: t.account, debit: r(o.total) }, { account: ACC.client, credit: r(o.total), thirdParty: await clientName(o) }],
      }))
    }
    // 3. Avoir : commande vendue puis annulée
    if (CANCELLED.includes(o.status) && done.has(`vente:${o.id}`)) {
      await post("avoir", o.id, async () => {
        const sale = await prisma.accEntry.findUnique({ where: { sourceType_sourceId: { sourceType: "vente", sourceId: o.id } }, include: { lines: true } })
        if (!sale) return null
        return {
          journal: "VE", date: o.updatedAt, label: `Avoir ${o.orderId} (commande annulée)`, reference: o.orderId,
          lines: sale.lines.map((l) => ({ account: l.account, debit: l.credit, credit: l.debit, label: `Avoir — ${l.label ?? ""}`, thirdParty: l.thirdParty, vatRate: l.vatRate })),
        }
      })
    }
  }

  // 4. Paiements en ligne confirmés (Versus)
  for (const p of payments) {
    const o = orders.find((x) => x.invoiceId && x.invoiceId === p.receiptNo)
    await post("encaissement", p.id, async () => ({
      journal: "MM", date: p.createdAt, label: `Paiement en ligne ${o?.orderId ?? p.receiptNo ?? ""}`.trim(), reference: o?.orderId ?? p.receiptNo,
      lines: [{ account: ACC.mobileMoney, debit: r(p.amount) }, { account: ACC.client, credit: r(p.amount), thirdParty: o ? await clientName(o) : null }],
    }))
  }

  // 5. Mouvements des portefeuilles (livreurs, boutique), retraits et remboursements
  const txs = await prisma.transaction.findMany({ where: { createdAt: { gte: since }, status: "Completed", type: { not: "Paiement Commande" } }, include: { driver: { select: { name: true } } }, orderBy: { createdAt: "asc" } })
  for (const t of txs) {
    const amount = r(t.amount)
    if (t.type === "Crédit" && t.method === "Livraison" && t.driverId) {
      await post("livreur", t.id, async () => ({
        journal: "OD", date: t.createdAt, label: t.description ?? "Frais de livraison", reference: t.receiptNo,
        lines: [{ account: ACC.deliveryCost, debit: amount }, { account: ACC.drivers, credit: amount, thirdParty: t.driver?.name ?? "Livreur" }],
      }))
    } else if (t.type === "Crédit" && t.method === "Vente") {
      // Part de la boutique : déjà dans l'écriture de vente (mode commission) ; rien à passer en mode « une seule entreprise »
    } else if (t.type === "Retrait") {
      const tr = treasuryFor(t.method)
      await post("retrait", t.id, async () => ({
        journal: tr.journal, date: t.createdAt, label: `Retrait ${t.driverId ? `livreur ${t.driver?.name ?? ""}` : "boutique"} (${t.method})`.replace(/\s+/g, " "), reference: t.receiptNo,
        lines: t.driverId
          ? [{ account: ACC.drivers, debit: amount, thirdParty: t.driver?.name ?? "Livreur" }, { account: tr.account, credit: amount }]
          : cfg.mode === "commission"
            ? [{ account: ACC.partnerStore, debit: amount }, { account: tr.account, credit: amount }]
            : [{ account: ACC.bank, debit: amount, label: "Virement vers la banque" }, { account: ACC.mobileMoney, credit: amount }],
      }))
    } else if (t.type === "Remboursement") {
      const tr = treasuryFor(t.method)
      await post("remboursement", t.id, async () => ({
        journal: tr.journal, date: t.createdAt, label: t.description ?? "Remboursement client", reference: t.receiptNo ?? t.description?.match(/ORD-[\w-]+/)?.[0],
        lines: [{ account: ACC.client, debit: amount, label: "Remboursement" }, { account: tr.account, credit: amount }],
      }))
    } else {
      // Crédits / débits manuels de portefeuille : nature à décider par le comptable (saisie manuelle)
      report.manual.push({ date: t.createdAt, label: `${t.type} ${t.method}${t.description ? ` — ${t.description}` : ""}`, amount })
    }
  }
  return report
}
