import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { getDeliveryConfig } from "@/lib/shopConfig"
import { parsePoint, quoteDelivery } from "@/lib/deliveryPricing"

/**
 * Devis de livraison : { lat, lng, goods } -> { fee, distanceKm, mode, free }.
 * Indicatif pour le panier : le prix réellement facturé est recalculé par le serveur à la création de la commande.
 */
export async function POST(req: Request) {
  if (!await rateLimit("delivery-quote:" + clientIp(req), 60, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de requetes, reessayez dans quelques minutes" }, { status: 429, headers: { "Retry-After": "600" } })
  }
  const b = await req.json().catch(() => ({}))
  const goods = Math.max(0, Number(b.goods) || 0)
  const point = parsePoint(b.lat, b.lng)
  const hasCoords = b.lat !== undefined && b.lat !== null && b.lat !== ""
  if (hasCoords && !point) return NextResponse.json({ error: "Position invalide ou hors du Sénégal", code: "POSITION_INVALIDE" }, { status: 400 })

  const q = quoteDelivery(await getDeliveryConfig(), point, goods)
  if (!q.ok) return NextResponse.json({ error: q.reason, code: q.code }, { status: 422 })
  return NextResponse.json({ fee: q.fee, distanceKm: q.distanceKm, mode: q.mode, free: q.free })
}
