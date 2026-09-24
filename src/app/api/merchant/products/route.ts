import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/merchantAuth"
import { parseProduct } from "@/lib/merchantApi"
import { isResponse, errorResponse } from "@/lib/adminAuth"

/** Catalogue de la boutique connectée (actifs et inactifs). */
export async function GET(req: NextRequest) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const products = await prisma.product.findMany({
      where: { storeId: auth.storeId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })
    return NextResponse.json(products)
  } catch (e) { return errorResponse(e) }
}

/** Ajout d'un produit — toujours rattaché à la boutique de la session, jamais à un storeId fourni. */
export async function POST(req: NextRequest) {
  const auth = await requireMerchant(req)
  if (isResponse(auth)) return auth
  try {
    const parsed = parseProduct(await req.json(), false)
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 })
    const product = await prisma.product.create({
      data: { ...parsed, name: parsed.name!, price: parsed.price!, storeId: auth.storeId },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (e) { return errorResponse(e) }
}
