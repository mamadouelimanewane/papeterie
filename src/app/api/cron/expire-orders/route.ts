import { NextResponse } from "next/server"
import { safeEqual } from "@/lib/auth"
import { releaseExpiredOrders } from "@/lib/orderExpiry"

/**
 * Tâche planifiée (Vercel Cron, voir vercel.json) : annule les commandes en ligne restées impayées
 * au-delà de ORDER_PAYMENT_TTL_MIN et libère leur stock.
 * Vercel envoie `Authorization: Bearer <CRON_SECRET>` ; sans CRON_SECRET configuré, tout est refusé.
 * Complète la libération « au fil de l'eau » faite à chaque nouvelle commande.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null
  if (!secret || !safeEqual(bearer, secret)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }
  try {
    let total = 0
    // Plusieurs lots si besoin (50 commandes par lot), borné pour rester dans le temps d'exécution
    for (let i = 0; i < 10; i++) {
      const n = await releaseExpiredOrders(50)
      total += n
      if (n < 50) break
    }
    return NextResponse.json({ ok: true, released: total })
  } catch (e) {
    console.error("[cron/expire-orders]", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
