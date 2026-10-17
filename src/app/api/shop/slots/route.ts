import { NextRequest, NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { listSlotOptions } from "@/lib/deliverySlots"

export const dynamic = "force-dynamic"

/** GET /api/shop/slots — créneaux de livraison proposés au panier (liste vide : pas de choix de créneau). */
export async function GET(req: NextRequest) {
  if (!(await rateLimit("shop-slots:" + clientIp(req), 120, 10 * 60_000))) {
    return NextResponse.json({ error: "Trop de requetes" }, { status: 429 })
  }
  try {
    return NextResponse.json({ slots: await listSlotOptions() }, { headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    console.error("[shop/slots]", e)
    return NextResponse.json({ slots: [] })
  }
}
