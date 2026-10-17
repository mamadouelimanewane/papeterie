/**
 * Kits par classe (back-office) : validation des données saisies.
 * Le prix catalogue du kit est TOUJOURS recalculé (somme prix × quantité des articles) : la vitrine et le
 * calcul de la commande (lib/pricing) appliquent ensuite la remise du kit sur cette somme.
 */
export const KIT_CYCLES = ["Primaire", "College", "Lycee"] as const

export type KitItemInput = { name: string; price: number; qty: number; vatRate?: number }
export type KitInput = {
  name?: string; level?: string; series?: string | null; cycle?: string; description?: string | null
  image?: string | null; discountPct?: number; items?: KitItemInput[]; price?: number; sequence?: number; status?: string
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "")

export function parseKit(b: Record<string, unknown>, partial: boolean): KitInput | string {
  const out: KitInput = {}
  if ("name" in b || !partial) { const v = str(b.name); if (!v) return "Le nom du kit est obligatoire"; out.name = v }
  if ("level" in b || !partial) { const v = str(b.level, 40); if (!v) return "La classe est obligatoire (ex. CM2, 6eme, Terminale)"; out.level = v }
  if ("cycle" in b || !partial) {
    const v = str(b.cycle, 20)
    if (!KIT_CYCLES.includes(v as (typeof KIT_CYCLES)[number])) return "Cycle invalide (Primaire, College ou Lycee)"
    out.cycle = v
  }
  if ("series" in b) out.series = str(b.series, 20) || null
  if ("description" in b) out.description = str(b.description, 1000) || null
  if ("image" in b) out.image = str(b.image, 500) || null
  if ("discountPct" in b) {
    const d = Number(b.discountPct ?? 0)
    if (!Number.isFinite(d) || d < 0 || d > 90) return "Remise invalide (0 à 90 %)"
    out.discountPct = Math.round(d * 10) / 10
  }
  if ("sequence" in b) { const n = Number(b.sequence); if (Number.isInteger(n)) out.sequence = n }
  if ("status" in b) out.status = b.status === "Inactive" ? "Inactive" : "Active"
  if ("items" in b || !partial) {
    if (!Array.isArray(b.items) || b.items.length === 0) return "Ajoutez au moins un article au kit"
    if (b.items.length > 80) return "80 articles au maximum par kit"
    const items: KitItemInput[] = []
    for (const raw of b.items as Record<string, unknown>[]) {
      const name = str(raw?.name, 200)
      const price = Number(raw?.price), qty = Number(raw?.qty)
      if (!name) return "Chaque article doit avoir un nom"
      if (!Number.isFinite(price) || price < 0) return `Prix invalide pour « ${name} »`
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) return `Quantité invalide pour « ${name} » (1 à 100)`
      if (items.some((i) => i.name === name)) return `Article en double : « ${name} »`
      // Taux de TVA facultatif : vide = taux du produit de même nom au catalogue, sinon taux par défaut
      const vr = raw?.vatRate === "" || raw?.vatRate === null || raw?.vatRate === undefined ? undefined : Number(raw.vatRate)
      if (vr !== undefined && (!Number.isFinite(vr) || vr < 0 || vr > 100)) return `TVA invalide pour « ${name} » (0 à 100 %)`
      items.push({ name, price: Math.round(price), qty, ...(vr !== undefined ? { vatRate: vr } : {}) })
    }
    out.items = items
    out.price = items.reduce((s, i) => s + i.price * i.qty, 0)
  }
  return out
}
