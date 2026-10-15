import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { safeEqual } from "@/lib/auth"
import { getActiveStoreId } from "@/lib/store"
import { clientIp, recordFailure, tooManyFailures } from "@/lib/ratelimit"

// Code marchand pour la gestion de contenu : MERCHANT_CODE obligatoire (pas de valeur par defaut).
const CODE = process.env.MERCHANT_CODE

// Anti force brute sur le code marchand :
// - 5 codes faux par adresse IP sur 15 minutes ;
// - 100 codes faux au total sur 1 heure (attaque répartie sur beaucoup d'IP).
const IP_MAX = 5
const IP_WINDOW = 15 * 60_000
const GLOBAL_MAX = 100
const GLOBAL_WINDOW = 60 * 60_000

const PRODUCT_STATUSES = ["Active", "Inactive"]
const MAX_PRICE = 10_000_000 // FCFA
const MAX_STOCK = 100_000

/** Nombre fini dans [min, max], sinon null. */
function num(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

const bad = (error: string) => NextResponse.json({ error }, { status: 400 })

export async function POST(req: Request) {
  const ipKey = "gestion-code:ip:" + clientIp(req)
  const globalKey = "gestion-code:global"
  if ((await tooManyFailures(ipKey, IP_MAX, IP_WINDOW)) || (await tooManyFailures(globalKey, GLOBAL_MAX, GLOBAL_WINDOW))) {
    return NextResponse.json(
      { error: "Trop de codes erronés : réessayez dans 15 minutes" },
      { status: 429, headers: { "Retry-After": "900" } },
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    if (!CODE || !safeEqual(typeof body.code === "string" ? body.code : null, CODE)) {
      await Promise.all([recordFailure(ipKey, IP_WINDOW), recordFailure(globalKey, GLOBAL_WINDOW)])
      return NextResponse.json({ error: "Code marchand invalide" }, { status: 401 })
    }

    if (body.kind === "category") {
      const name = String(body.name ?? "").trim()
      if (!name || name.length > 80) return bad("Nom de categorie requis (80 caracteres max)")
      const cat = await prisma.category.create({
        data: { name, segment: "Papeterie", status: "Active" },
      })
      return NextResponse.json({ ok: true, category: cat }, { status: 201 })
    }

    if (body.kind === "product") {
      const name = String(body.name ?? "").trim()
      const price = num(body.price, 1, MAX_PRICE)
      const stock = body.stock === undefined || body.stock === null || body.stock === "" ? 0 : num(body.stock, 0, MAX_STOCK)
      if (!name || name.length > 200) return bad("Nom requis (200 caracteres max)")
      if (price === null) return bad("Prix invalide (superieur a 0)")
      if (stock === null || !Number.isInteger(stock)) return bad("Stock invalide (entier positif)")
      const storeId = await getActiveStoreId()
      if (!storeId) return bad("Aucune boutique active")
      const p = await prisma.product.create({
        data: {
          name,
          price,
          category: body.category ? String(body.category).slice(0, 80) : null,
          image: body.image ? String(body.image).slice(0, 2000) : null,
          stock,
          storeId,
          status: "Active",
        },
      })
      return NextResponse.json({ ok: true, product: p }, { status: 201 })
    }

    if (body.kind === "promo") {
      const code = String(body.promoCode ?? "").trim().toUpperCase()
      const type = body.type === "Fixed" ? "Fixed" : "Percentage"
      // Pourcentage : 1 à 90 % (une remise de 100 % rendrait la commande gratuite) ; montant fixe : au moins 1 FCFA.
      const discount = type === "Percentage" ? num(body.discount, 1, 90) : num(body.discount, 1, MAX_PRICE)
      const maxUses = body.maxUses ? num(body.maxUses, 1, 1_000_000) : null
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
      if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return bad("Code promo invalide (3 a 30 lettres, chiffres, - ou _)")
      if (discount === null) return bad(type === "Percentage" ? "Remise invalide (1 a 90 %)" : "Remise invalide")
      if (body.maxUses && (maxUses === null || !Number.isInteger(maxUses))) return bad("Nombre d'utilisations invalide")
      if (expiresAt && Number.isNaN(expiresAt.getTime())) return bad("Date d'expiration invalide")
      const promo = await prisma.promoCode.create({
        data: { code, discount, type, maxUses, expiresAt, status: "Active" },
      })
      return NextResponse.json({ ok: true, promo }, { status: 201 })
    }

    if (body.kind === "product-update") {
      if (!body.id) return bad("id produit requis")
      const update: Record<string, unknown> = {}
      if (body.stock !== undefined && body.stock !== "") {
        const stock = num(body.stock, 0, MAX_STOCK)
        if (stock === null || !Number.isInteger(stock)) return bad("Stock invalide (entier positif)")
        update.stock = stock
      }
      if (body.price !== undefined && body.price !== "") {
        const price = num(body.price, 1, MAX_PRICE)
        if (price === null) return bad("Prix invalide (superieur a 0)")
        update.price = price
      }
      if (body.status) {
        if (!PRODUCT_STATUSES.includes(body.status)) return bad("Statut invalide")
        update.status = body.status
      }
      // Seuls les produits de la boutique active sont modifiables depuis cette page
      const storeId = await getActiveStoreId()
      const r = await prisma.product.updateMany({ where: { id: String(body.id), ...(storeId ? { storeId } : {}) }, data: update })
      if (r.count === 0) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
      const p = await prisma.product.findUnique({ where: { id: String(body.id) } })
      return NextResponse.json({ ok: true, product: p })
    }

    return bad("kind invalide (category|product|promo|product-update)")
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === "P2002") return NextResponse.json({ error: "Cette valeur existe deja" }, { status: 409 })
    console.error("[api/gestion]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
