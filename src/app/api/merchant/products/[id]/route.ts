import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/merchantAuth"
import { parseProduct } from "@/lib/merchantApi"
import { isResponse, errorResponse } from "@/lib/adminAuth"

/** Modification d'un produit de SA boutique (un produit d'une autre boutique renvoie 404). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const parsed = parseProduct(await req.json(), true)
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 })
    const { count } = await prisma.product.updateMany({ where: { id, storeId: auth.storeId }, data: parsed })
    if (count !== 1) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
    return NextResponse.json(await prisma.product.findUnique({ where: { id } }))
  } catch (e) { return errorResponse(e) }
}
