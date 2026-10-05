/**
 * Frais de livraison selon la distance (Dakar).
 *
 *   distance = distance à vol d'oiseau (haversine) × coefficient routier  (1,3 par défaut : les routes ne sont pas droites)
 *   frais    = frais de base                       si distance ≤ km inclus
 *            = frais de base + (distance − km inclus) × prix du km   au-delà, arrondi au multiple de 50 F supérieur
 *   plafonné à « frais maximum » ; refusé au-delà de la « distance maximale » ; offert au-dessus d'un montant d'achat (option).
 *
 * Tous les paramètres sont réglables dans l'administration (Paramètres → Configuration générale). Tant que le mode
 * « Distance » n'est pas activé ou que la position de la boutique n'est pas renseignée, le tarif fixe s'applique.
 */
export type DeliveryMode = "Fixed" | "Distance"

export type DeliveryConfig = {
  mode: DeliveryMode
  storeLat: number | null
  storeLng: number | null
  baseFee: number // frais de base, aussi le tarif fixe
  baseKm: number // kilomètres inclus dans le frais de base
  perKm: number // prix de chaque kilomètre supplémentaire
  maxKm: number // au-delà : livraison impossible
  maxFee: number // plafond des frais (0 = pas de plafond)
  roadFactor: number
  freeAbove: number // livraison offerte au-dessus de ce montant d'articles (0 = jamais)
}

export const DEFAULT_DELIVERY: DeliveryConfig = {
  mode: "Fixed", storeLat: null, storeLng: null, baseFee: 500, baseKm: 2, perKm: 150, maxKm: 25, maxFee: 5000, roadFactor: 1.3, freeAbove: 0,
}

const ROUND_TO = 50
// Boîte englobante du Sénégal : toute position hors de cette zone est refusée (faute de saisie, GPS erroné).
const BOUNDS = { latMin: 12.0, latMax: 16.8, lngMin: -17.8, lngMax: -11.3 }

export type Point = { lat: number; lng: number }

export function parsePoint(lat: unknown, lng: unknown): Point | null {
  const a = Number(lat), b = Number(lng)
  if (lat === null || lat === undefined || lat === "" || lng === null || lng === undefined || lng === "") return null
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (a < BOUNDS.latMin || a > BOUNDS.latMax || b < BOUNDS.lngMin || b > BOUNDS.lngMax) return null
  return { lat: a, lng: b }
}

/** Distance à vol d'oiseau entre deux points, en kilomètres (formule de haversine). */
export function haversineKm(a: Point, b: Point): number {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export type Quote =
  | { ok: true; mode: DeliveryMode; fee: number; distanceKm: number | null; free: boolean }
  | { ok: false; reason: string; code: "POSITION_REQUISE" | "HORS_ZONE" | "POSITION_INVALIDE" }

/**
 * Calcule les frais d'une livraison. `goods` = montant des articles après remise (pour la livraison offerte).
 * `point` = position de livraison du client (null si non fournie).
 */
export function quoteDelivery(cfg: DeliveryConfig, point: Point | null, goods: number): Quote {
  const free = cfg.freeAbove > 0 && goods >= cfg.freeAbove
  const distanceMode = cfg.mode === "Distance" && cfg.storeLat !== null && cfg.storeLng !== null

  if (!distanceMode) return { ok: true, mode: "Fixed", fee: free ? 0 : cfg.baseFee, distanceKm: null, free }
  if (!point) return { ok: false, code: "POSITION_REQUISE", reason: "Indiquez votre position de livraison (bouton « Ma position » ou recherche d'adresse) pour calculer les frais." }

  const km = haversineKm({ lat: cfg.storeLat!, lng: cfg.storeLng! }, point) * cfg.roadFactor
  const distanceKm = Math.round(km * 10) / 10
  if (km > cfg.maxKm) return { ok: false, code: "HORS_ZONE", reason: `Adresse hors de la zone de livraison (${distanceKm} km, maximum ${cfg.maxKm} km).` }

  let fee = cfg.baseFee + Math.max(0, km - cfg.baseKm) * cfg.perKm
  fee = Math.ceil(fee / ROUND_TO) * ROUND_TO
  if (cfg.maxFee > 0) fee = Math.min(fee, cfg.maxFee)
  return { ok: true, mode: "Distance", fee: free ? 0 : fee, distanceKm, free }
}

/** Mention enregistrée dans les notes de la commande : lisible par le livreur, relue par `readDeliveryTag`. */
export function deliveryTag(distanceKm: number | null, point: Point | null): string | null {
  if (!point) return null
  return `[Livraison: ${distanceKm !== null ? String(distanceKm).replace(".", ",") + " km" : "distance n.c."} · GPS ${point.lat.toFixed(5)},${point.lng.toFixed(5)}]`
}

export function readDeliveryTag(notes: string | null | undefined): { distanceKm: number | null; point: Point | null } {
  const m = notes?.match(/\[Livraison:\s*([^·\]]*)·\s*GPS\s*(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]/)
  if (!m) return { distanceKm: null, point: null }
  const km = parseFloat(m[1].replace(",", "."))
  return { distanceKm: Number.isFinite(km) ? km : null, point: parsePoint(m[2], m[3]) }
}
