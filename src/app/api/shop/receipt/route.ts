import { NextRequest, NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { buildReceipt, isValidReceiptToken } from "@/lib/receipt"

/**
 * Reçu d'une commande payée : GET /api/shop/receipt?orderId=ORD-…&t=<jeton>
 * Le jeton (signé côté serveur) figure dans le lien de retour de paiement et dans « Mes commandes ».
 * Sans jeton valide : 404, comme une commande inexistante (on ne confirme pas l'existence de la commande).
 */
export async function GET(req: NextRequest) {
  if (!await rateLimit("shop-receipt:" + clientIp(req), 60, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de requetes, reessayez dans quelques minutes" }, { status: 429, headers: { "Retry-After": "600" } })
  }
  const orderId = req.nextUrl.searchParams.get("orderId")?.trim() ?? ""
  const token = req.nextUrl.searchParams.get("t")
  if (!/^[A-Z0-9-]{4,60}$/i.test(orderId) || !isValidReceiptToken(orderId, token)) {
    return NextResponse.json({ error: "Reçu introuvable" }, { status: 404 })
  }
  try {
    const receipt = await buildReceipt(orderId)
    if (!receipt) return NextResponse.json({ error: "Reçu disponible après confirmation du paiement" }, { status: 404 })
    return NextResponse.json(receipt, { headers: { "Cache-Control": "private, no-store" } })
  } catch (e) {
    console.error("[shop/receipt]", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
