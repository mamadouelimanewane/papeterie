import { prisma } from "@/lib/prisma"

/** Moyens de paiement en ligne (Versus : Wave, Orange Money…). Seuls moyens acceptés pour une nouvelle commande. */
export const ONLINE_PAYMENT_METHODS = ["Versus", "Wave", "Orange", "Orange Money"]

/** Statuts d'une commande annulée (les deux orthographes coexistent dans la base). */
export const CANCELLED_STATUSES = ["Cancelled", "Annule"]

/** Statut de paiement d'une commande payée après expiration, dont le stock n'a pas pu être re-réservé. */
export const REFUND_STATUS = "A rembourser"

/**
 * Délai laissé pour payer une commande en ligne avant de libérer son stock.
 * Réglable par ORDER_PAYMENT_TTL_MIN (minutes, 15 à 1440 ; défaut 60).
 */
export function paymentTtlMs(): number {
  const n = Number(process.env.ORDER_PAYMENT_TTL_MIN)
  const min = Number.isFinite(n) && n >= 15 && n <= 1440 ? n : 60
  return min * 60_000
}

type StockItem = { productId?: string; quantity?: number }
const stockItems = (items: unknown): StockItem[] => (Array.isArray(items) ? (items as StockItem[]) : [])

/** Remet en stock les articles d'une commande (après annulation). */
export async function restoreStock(items: unknown): Promise<void> {
  for (const item of stockItems(items)) {
    if (item.productId && item.quantity) {
      await prisma.product
        .update({ where: { id: item.productId }, data: { stock: { increment: Number(item.quantity) } } })
        .catch((e) => console.error("[stock] restauration impossible", item.productId, e))
    }
  }
}

/**
 * Re-réserve le stock d'une commande (paiement reçu après expiration).
 * Tout ou rien : renvoie false si un article n'est plus disponible.
 */
export async function reserveStockAgain(items: unknown): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of stockItems(items)) {
        if (!item.productId || !item.quantity) continue
        const r = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: Number(item.quantity) } },
          data: { stock: { decrement: Number(item.quantity) } },
        })
        if (r.count === 0) throw new Error("stock insuffisant")
      }
    })
    return true
  } catch {
    return false
  }
}

/**
 * Annule les commandes en ligne restées impayées au-delà du délai et libère leur stock.
 * Chaque commande est « réclamée » par une mise à jour conditionnelle : deux exécutions
 * simultanées (ou un webhook qui arrive au même moment) ne libèrent jamais deux fois le stock.
 */
export async function releaseExpiredOrders(limit = 50): Promise<number> {
  const cutoff = new Date(Date.now() - paymentTtlMs())
  const expired = await prisma.order.findMany({
    where: {
      status: "Pending",
      paymentStatus: "En attente",
      paymentMethod: { in: ONLINE_PAYMENT_METHODS },
      createdAt: { lt: cutoff },
    },
    select: { id: true, items: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  })

  let released = 0
  for (const o of expired) {
    const { count } = await prisma.order.updateMany({
      where: { id: o.id, status: "Pending", paymentStatus: "En attente" },
      data: { status: "Cancelled", paymentStatus: "Expire" },
    })
    if (count !== 1) continue
    await restoreStock(o.items)
    released++
  }
  if (released) console.log(`[orders] ${released} commande(s) impayée(s) expirée(s), stock libéré`)
  return released
}

let lastSweep = 0

/**
 * Version « au fil de l'eau » : au plus une passe toutes les 5 minutes par instance.
 * Appelée avant chaque nouvelle commande pour que le stock bloqué par des impayés soit
 * libéré sans attendre la tâche planifiée. N'échoue jamais.
 */
export async function releaseExpiredOrdersThrottled(): Promise<void> {
  const now = Date.now()
  if (now - lastSweep < 5 * 60_000) return
  lastSweep = now
  try {
    await releaseExpiredOrders()
  } catch (e) {
    console.error("[orders] libération des impayés échouée", e)
  }
}

/**
 * Commandes qu'un livreur peut voir et accepter : payées en ligne, ou anciennes commandes « paiement à la
 * livraison » créées avant la suppression du cash. Une commande en ligne impayée n'est jamais proposée :
 * le livreur livrerait des articles non réglés.
 */
export function deliverableWhere(paidStatuses: string[]) {
  return {
    status: { in: ["Pending", "Confirme"] },
    driverId: null,
    OR: [{ paymentStatus: { in: paidStatuses } }, { paymentMethod: "Cash" }],
  }
}
