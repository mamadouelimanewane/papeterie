import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getActiveStoreId } from "@/lib/store"

// Code marchand simple pour la gestion de contenu (demo). A definir via MERCHANT_CODE.
const CODE = process.env.MERCHANT_CODE ?? "schoolmatik"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!CODE || body.code !== CODE) {
      return NextResponse.json({ error: "Code marchand invalide" }, { status: 401 })
    }

    if (body.kind === "category") {
      if (!body.name) return NextResponse.json({ error: "Nom de categorie requis" }, { status: 400 })
      const cat = await prisma.category.create({
        data: { name: String(body.name).trim(), segment: "Papeterie", status: "Active" },
      })
      return NextResponse.json({ ok: true, category: cat }, { status: 201 })
    }

    if (body.kind === "product") {
      if (!body.name || !body.price) return NextResponse.json({ error: "Nom et prix requis" }, { status: 400 })
      const storeId = await getActiveStoreId()
      if (!storeId) return NextResponse.json({ error: "Aucune boutique active" }, { status: 400 })
      const p = await prisma.product.create({
        data: {
          name: String(body.name).trim(),
          price: Number(body.price),
          category: body.category ? String(body.category) : null,
          image: body.image ? String(body.image) : null,
          stock: Number(body.stock ?? 0),
          storeId,
          status: "Active",
        },
      })
      return NextResponse.json({ ok: true, product: p }, { status: 201 })
    }

    if (body.kind === "promo") {
      if (!body.promoCode || body.discount == null) return NextResponse.json({ error: "Code et remise requis" }, { status: 400 })
      const promo = await prisma.promoCode.create({
        data: {
          code: String(body.promoCode).trim().toUpperCase(),
          discount: Number(body.discount),
          type: body.type === "Fixed" ? "Fixed" : "Percentage",
          maxUses: body.maxUses ? Number(body.maxUses) : null,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          status: "Active",
        },
      })
      return NextResponse.json({ ok: true, promo }, { status: 201 })
    }

    if (body.kind === "product-update") {
      if (!body.id) return NextResponse.json({ error: "id produit requis" }, { status: 400 })
      const update: Record<string, unknown> = {}
      if (body.stock !== undefined) update.stock = Number(body.stock)
      if (body.price !== undefined && body.price !== "") update.price = Number(body.price)
      if (body.status) update.status = body.status
      const p = await prisma.product.update({ where: { id: String(body.id) }, data: update })
      return NextResponse.json({ ok: true, product: p })
    }

    return NextResponse.json({ error: "kind invalide (category|product|promo|product-update)" }, { status: 400 })
  } catch (error) {
    console.error("[api/gestion]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
