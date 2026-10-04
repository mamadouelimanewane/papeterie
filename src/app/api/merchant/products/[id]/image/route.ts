import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/merchantAuth"
import { isResponse, errorResponse } from "@/lib/adminAuth"
import { ImageError, clearProductImage, readUpload, replaceProductImage } from "@/lib/productImages"

/** Ajoute ou remplace la photo d'un produit de SA boutique (un produit d'une autre boutique renvoie 404). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const product = await prisma.product.findFirst({ where: { id, storeId: auth.storeId }, select: { id: true, image: true, storeId: true } })
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
    const url = await replaceProductImage(product, await readUpload(req))
    return NextResponse.json({ image: url })
  } catch (e) {
    if (e instanceof ImageError) return NextResponse.json({ error: e.message }, { status: 400 })
    return errorResponse(e)
  }
}

/** Retire la photo d'un produit de SA boutique. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const product = await prisma.product.findFirst({ where: { id, storeId: auth.storeId }, select: { id: true, image: true } })
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
    await clearProductImage(product)
    return NextResponse.json({ image: null })
  } catch (e) { return errorResponse(e) }
}
