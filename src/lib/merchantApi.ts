/** Champs de commande visibles par le marchand : pas d'OTP de livraison ni de signature (réservés client/livreur). */
export const MERCHANT_ORDER_SELECT = {
  id: true, orderId: true, total: true, subtotal: true, deliveryFee: true, status: true,
  paymentMethod: true, paymentStatus: true, items: true, address: true, notes: true,
  pickupOtp: true, // code à donner au livreur lors du retrait en boutique
  driverId: true, createdAt: true, updatedAt: true,
  driver: { select: { name: true, phone: true } },
} as const

export type ProductInput = {
  name?: string
  description?: string | null
  price?: number
  stock?: number
  category?: string | null
  image?: string | null
  status?: string
}

/** Valide et normalise les champs produit modifiables par le marchand (message d'erreur si invalide). */
export function parseProduct(b: Record<string, unknown>, partial: boolean): ProductInput | string {
  const out: ProductInput = {}
  if ("name" in b || !partial) {
    const name = String(b.name ?? "").trim()
    if (!name) return "Le nom est obligatoire"
    out.name = name.slice(0, 200)
  }
  if ("price" in b || !partial) {
    const price = Number(b.price)
    if (b.price === "" || b.price === null || !Number.isFinite(price) || price < 0) return "Prix invalide"
    out.price = Math.round(price)
  }
  if ("stock" in b && b.stock !== "" && b.stock !== null) {
    const stock = Number(b.stock)
    if (!Number.isInteger(stock) || stock < 0) return "Stock invalide"
    out.stock = stock
  }
  if ("status" in b) {
    if (!["Active", "Inactive"].includes(String(b.status))) return "Statut invalide"
    out.status = String(b.status)
  }
  for (const key of ["description", "category", "image"] as const) {
    if (key in b) out[key] = b[key] ? String(b[key]).trim().slice(0, key === "description" ? 2000 : 1000) : null
  }
  return out
}
