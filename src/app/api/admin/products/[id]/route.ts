import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import { parseProduct } from "@/lib/merchantApi"

/**
 * Mise à jour d'un produit.
 * - Stock seul : { addStock: n } (réapprovisionnement) ou { stock: n } (inventaire) ;
 * - Fiche : { name, price, category, description, status, stock, barcode } (mêmes règles que l'espace boutique).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req, "stores.manage")
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const b = await req.json()
    const keys = Object.keys(b ?? {})
    if (b.addStock !== undefined) {
      const add = Number(b.addStock)
      if (!Number.isInteger(add) || add <= 0) return NextResponse.json({ error: "Quantité invalide" }, { status: 400 })
      return NextResponse.json(await prisma.product.update({ where: { id }, data: { stock: { increment: add } }, select: { id: true, name: true, stock: true } }))
    }
    if (keys.length === 1 && keys[0] === "stock") {
      const set = Number(b.stock)
      if (!Number.isInteger(set) || set < 0) return NextResponse.json({ error: "Stock invalide" }, { status: 400 })
      return NextResponse.json(await prisma.product.update({ where: { id }, data: { stock: set }, select: { id: true, name: true, stock: true } }))
    }
    const parsed = parseProduct(b, true)
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 })
    const data: Record<string, unknown> = { ...parsed }
    if ("barcode" in b) data.barcode = b.barcode ? String(b.barcode).trim().slice(0, 64) : null
    if (!Object.keys(data).length) return NextResponse.json({ error: "Aucune modification" }, { status: 400 })
    const p = await prisma.product.update({ where: { id }, data })
    return NextResponse.json(p)
  } catch (e) { return errorResponse(e) }
}
