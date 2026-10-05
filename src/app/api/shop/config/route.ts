import { NextResponse } from "next/server"
import { getDeliveryConfig, getPromotionsEnabled } from "@/lib/shopConfig"

/**
 * Configuration publique de la vitrine : codes promo actifs ? tarif de livraison ?
 * (aucune donnée sensible : la position exacte de la boutique n'est pas renvoyée).
 */
export async function GET() {
  const [promotionsEnabled, d] = await Promise.all([getPromotionsEnabled(), getDeliveryConfig()])
  const distance = d.mode === "Distance" && d.storeLat !== null && d.storeLng !== null
  return NextResponse.json(
    {
      promotionsEnabled,
      delivery: {
        mode: distance ? "Distance" : "Fixed",
        baseFee: d.baseFee, baseKm: d.baseKm, perKm: d.perKm, maxKm: d.maxKm, maxFee: d.maxFee, freeAbove: d.freeAbove,
        // la recherche d'adresse est disponible dès que le serveur peut interroger un service de géocodage (toujours vrai : repli OpenStreetMap)
        geocoding: true,
      },
    },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
  )
}
