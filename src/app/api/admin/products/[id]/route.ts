import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/** Mise à jour du stock d'un produit. Corps : { addStock: n } (réapprovisionnement) ou { stock: n } (inventaire). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req, "stores.manage")
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const b = await req.json()
    const add = Number(b.addStock), set = Number(b.stock)
    let data: { stock: number | { increment: number } }
    if (b.addStock !== undefined) {
      if (!Number.isInteger(add) || add <= 0) return NextResponse.json({ error: "Quantité invalide" }, { status: 400 })
      data = { stock: { increment: add } }
    } else if (b.stock !== undefined) {
      if (!Number.isInteger(set) || set < 0) return NextResponse.json({ error: "Stock invalide" }, { status: 400 })
      data = { stock: set }
    } else return NextResponse.json({ error: "addStock ou stock attendu" }, { status: 400 })
    const p = await prisma.product.update({ where: { id }, data, select: { id: true, name: true, stock: true } })
    return NextResponse.json(p)
  } catch (e) { return errorResponse(e) }
}
