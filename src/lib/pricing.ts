import type { Prisma } from "@prisma/client"

export const DELIVERY_FEE = 500

export class PricingError extends Error {}

export type PricedItem = {
  productId?: string
  kitId?: string
  name: string
  price: number
  quantity: number
  components?: { name: string; price: number; qty: number }[]
}

type RawItem = {
  productId?: unknown; id?: unknown; kitId?: unknown; name?: unknown
  quantity?: unknown; qty?: unknown; components?: unknown
}

function qtyOf(i: RawItem): number {
  const q = Number(i.quantity ?? i.qty ?? 1)
  if (!Number.isInteger(q) || q < 1 || q > 100) throw new PricingError("Quantite invalide")
  return q
}

/**
 * Recalcule chaque ligne depuis la base (produit ou kit) : le prix envoye par le
 * client est ignore. Les kits personnalises sont verifies composant par composant.
 */
export async function priceItems(tx: Prisma.TransactionClient, storeId: string, raw: unknown): Promise<PricedItem[]> {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 100) throw new PricingError("Panier invalide")
  const out: PricedItem[] = []

  for (const r of raw as RawItem[]) {
    const quantity = qtyOf(r)
    const productId = typeof r.productId === "string" ? r.productId : typeof r.id === "string" && !r.id.includes(":") ? r.id : null
    const kitId = typeof r.kitId === "string" ? r.kitId : typeof r.id === "string" && r.id.includes(":") ? r.id.split(":")[0] : null

    if (kitId) {
      const kit = await tx.kit.findFirst({ where: { id: kitId, storeId, status: "Active" } })
      if (!kit) throw new PricingError("Kit introuvable")
      const kitItems = (Array.isArray(kit.items) ? kit.items : []) as { name: string; price: number; qty: number }[]
      const comps = Array.isArray(r.components) ? (r.components as { name?: unknown; qty?: unknown }[]) : kitItems
      let sum = 0
      const components: PricedItem["components"] = []
      for (const c of comps) {
        const ref = kitItems.find((k) => k.name === c.name)
        const cq = Number(c.qty ?? ref?.qty)
        if (!ref || !Number.isInteger(cq) || cq < 1 || cq > 100) throw new PricingError("Composant de kit invalide")
        sum += ref.price * cq
        components.push({ name: ref.name, price: ref.price, qty: cq })
      }
      if (components.length === 0) throw new PricingError("Kit vide")
      const price = Math.round(sum * (1 - (kit.discountPct ?? 0) / 100))
      out.push({ kitId, name: String(r.name ?? kit.name), price, quantity, components })
      continue
    }

    if (productId) {
      const p = await tx.product.findFirst({ where: { id: productId, storeId, status: "Active" } })
      if (!p) throw new PricingError(`Produit introuvable : ${String(r.name ?? productId)}`)
      out.push({ productId: p.id, name: p.name, price: p.price, quantity })
      continue
    }

    throw new PricingError("Article sans identifiant produit")
  }
  return out
}

/** Valide un code promo cote serveur et renvoie la remise (0 si aucun code). */
export async function promoDiscount(tx: Prisma.TransactionClient, code: unknown, goods: number): Promise<{ code: string | null; amount: number }> {
  if (!code) return { code: null, amount: 0 }
  const promo = await tx.promoCode.findUnique({ where: { code: String(code).trim().toUpperCase() } })
  if (!promo || promo.status !== "Active") throw new PricingError("Code promo invalide")
  if (promo.expiresAt && promo.expiresAt < new Date()) throw new PricingError("Code promo expire")
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) throw new PricingError("Code promo epuise")
  const raw = promo.type === "Percentage" ? Math.round((goods * promo.discount) / 100) : promo.discount
  return { code: promo.code, amount: Math.max(0, Math.min(goods, raw)) }
}
