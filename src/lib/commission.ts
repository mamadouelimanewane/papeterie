import { prisma } from "@/lib/prisma"

const DEFAULT_PCT = 10
let cache: { pct: number; at: number } | null = null

/**
 * Commission de la plateforme (%), réglée dans Paramètres → Configuration (clé « general », champ commissionPct).
 * Lue à chaque nouvelle commande (cache 60 s) : changer le taux s'applique aux commandes suivantes,
 * les commandes déjà passées gardent la commission enregistrée.
 */
export async function getCommissionPct(): Promise<number> {
  if (cache && Date.now() - cache.at < 60_000) return cache.pct
  let pct = DEFAULT_PCT
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: "general" } })
    const v = Number((row?.value as { commissionPct?: number } | null)?.commissionPct)
    if (Number.isFinite(v) && v >= 0 && v <= 100) pct = v
  } catch { /* paramètre illisible : taux par défaut */ }
  cache = { pct, at: Date.now() }
  return pct
}

/** Efface le cache (appelé quand l'administrateur enregistre un nouveau taux). */
export function resetCommissionCache() { cache = null }
