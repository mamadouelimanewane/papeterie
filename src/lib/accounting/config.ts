import { getSetting } from "@/lib/appSettings"

/**
 * Réglages comptables (Comptabilité › Réglages, clé « accounting ») :
 *  - TVA : taux par défaut, taux par catégorie de produits, taux de la livraison ;
 *    chaque produit peut avoir son propre taux (fiche produit), prioritaire sur sa catégorie ;
 *  - mode : « single » (l'entreprise vend : tout le prix est du chiffre d'affaires)
 *    ou « commission » (la plateforme ne garde que sa commission, le reste est dû à la boutique) ;
 *  - date de début de la comptabilité (reprise automatique des opérations depuis cette date) ;
 *  - identité de l'entreprise (en-têtes des états).
 */
export type AccountingConfig = {
  vatDefault: number
  deliveryVatRate: number
  categoryRates: Record<string, number>
  mode: "single" | "commission"
  startDate: string
  company: { name: string; ninea: string; rccm: string; address: string; city: string }
}

export const ACCOUNTING_DEFAULTS: AccountingConfig = {
  vatDefault: 18,
  deliveryVatRate: 18,
  // Livres scolaires exonérés de TVA (Code général des impôts du Sénégal) : à confirmer par l'expert-comptable
  categoryRates: { Livres: 0 },
  mode: "single",
  startDate: "2026-01-01",
  company: { name: "Schoolmatik Librairie", ninea: "", rccm: "", address: "", city: "Dakar" },
}

const rate = (v: unknown, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : fallback
}

export async function getAccountingConfig(): Promise<AccountingConfig> {
  const s = (await getSetting("accounting")) as Partial<AccountingConfig>
  const cats: Record<string, number> = {}
  for (const [k, v] of Object.entries((s.categoryRates ?? ACCOUNTING_DEFAULTS.categoryRates) as Record<string, unknown>)) cats[k] = rate(v, ACCOUNTING_DEFAULTS.vatDefault)
  return {
    vatDefault: rate(s.vatDefault, ACCOUNTING_DEFAULTS.vatDefault),
    deliveryVatRate: rate(s.deliveryVatRate, ACCOUNTING_DEFAULTS.deliveryVatRate),
    categoryRates: cats,
    mode: s.mode === "commission" ? "commission" : "single",
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(String(s.startDate)) ? String(s.startDate) : ACCOUNTING_DEFAULTS.startDate,
    company: { ...ACCOUNTING_DEFAULTS.company, ...(s.company ?? {}) },
  }
}

/** Taux de TVA d'un produit : le sien, sinon celui de sa catégorie, sinon le taux par défaut. */
export function productVatRate(p: { vatRate?: number | null; category?: string | null }, cfg: AccountingConfig): number {
  if (p.vatRate !== null && p.vatRate !== undefined && Number.isFinite(p.vatRate)) return p.vatRate
  if (p.category && cfg.categoryRates[p.category] !== undefined) return cfg.categoryRates[p.category]
  return cfg.vatDefault
}
