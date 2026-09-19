import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Valide un code promo (public) : renvoie la remise applicable.
export async function POST(req: Request) {
  try {
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
