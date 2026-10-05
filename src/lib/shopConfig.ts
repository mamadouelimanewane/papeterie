import { getSetting } from "@/lib/appSettings"
import { DEFAULT_DELIVERY, type DeliveryConfig } from "@/lib/deliveryPricing"

const num = (v: unknown, fallback: number, min = 0) => {
  const n = Number(v)
  return v !== "" && v !== null && v !== undefined && Number.isFinite(n) && n >= min ? n : fallback
}

/**
 * Codes promo : DESACTIVES par défaut. Réactivables à tout moment dans Paramètres → Configuration générale
 * (case « Codes promo activés »). Désactivés : le champ disparaît du panier et le serveur refuse tout code.
 */
export async function getPromotionsEnabled(): Promise<boolean> {
  const g = await getSetting("general")
  return g.promotionsEnabled === true
}

/** Tarif de livraison réglé dans Paramètres → Configuration générale (clé « general »). */
export async function getDeliveryConfig(): Promise<DeliveryConfig> {
  const g = await getSetting("general")
  const d = DEFAULT_DELIVERY
  const lat = g.deliveryStoreLat === "" || g.deliveryStoreLat == null ? null : Number(g.deliveryStoreLat)
  const lng = g.deliveryStoreLng === "" || g.deliveryStoreLng == null ? null : Number(g.deliveryStoreLng)
  return {
    mode: g.deliveryMode === "Distance" ? "Distance" : "Fixed",
    storeLat: lat !== null && Number.isFinite(lat) ? lat : null,
    storeLng: lng !== null && Number.isFinite(lng) ? lng : null,
    baseFee: num(g.defaultDeliveryFee, d.baseFee),
    baseKm: num(g.deliveryBaseKm, d.baseKm),
    perKm: num(g.deliveryPerKm, d.perKm),
    maxKm: num(g.deliveryMaxKm, d.maxKm, 1),
    maxFee: num(g.deliveryMaxFee, d.maxFee),
    roadFactor: num(g.deliveryRoadFactor, d.roadFactor, 1),
    freeAbove: num(g.deliveryFreeAbove, d.freeAbove),
  }
}
