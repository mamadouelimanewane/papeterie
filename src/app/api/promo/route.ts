import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { clientIp, rateLimit } from "@/lib/ratelimit"
import { getPromotionsEnabled } from "@/lib/shopConfig"

// Valide un code promo (public) : renvoie la remise applicable.
export async function POST(req: Request) {
  if (!await rateLimit("promo:" + clientIp(req), 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de requetes, reessayez dans quelques minutes" }, { status: 429, headers: { "Retry-After": "600" } })
  }
  try {
    if (!(await getPromotionsEnabled())) {
      return NextResponse.json({ valid: false, disabled: true, error: "Les codes promo sont actuellement désactivés" })
    }
    const { code } = await req.json()
    if (!code) return NextResponse.json({ valid: false, error: "Code requis" }, { status: 400 })

    const promo = await prisma.promoCode.findUnique({ where: { code: String(code).trim().toUpperCase() } })
    if (!promo || promo.status !== "Active") {
      return NextResponse.json({ valid: false, error: "Code invalide" })
    }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: "Code expire" })
    }
    if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ valid: false, error: "Code epuise" })
    }
    return NextResponse.json({ valid: true, code: promo.code, discount: promo.discount, type: promo.type })
  } catch (error) {
    console.error("[api/promo]", error)
    return NextResponse.json({ valid: false, error: "Erreur serveur" }, { status: 500 })
  }
}
