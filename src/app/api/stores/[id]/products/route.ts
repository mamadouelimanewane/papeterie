import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const products = await prisma.product.findMany({
      where: { storeId: id, status: "Active" },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("[store-products-get]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
