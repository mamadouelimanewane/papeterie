import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getActiveStoreId } from "@/lib/store"

/**
 * Renvoie LA boutique active (mode mono-boutique).
 * ?products=1 inclut le catalogue (produits actifs).
 * Route publique : sert de vitrine au client.
 */
export async function GET(req: Request) {
  try {
    const id = await getActiveStoreId()
    if (!id) return NextResponse.json({ error: "Aucune boutique active configuree" }, { status: 404 })

    const withProducts = new URL(req.url).searchParams.get("products") === "1"
    const store = await prisma.store.findUnique({
      where: { id },
      include: withProducts
        ? { products: { where: { status: "Active" }, orderBy: { createdAt: "desc" } } }
        : undefined,
    })
    if (!store) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })
    return NextResponse.json(store)
  } catch (error) {
    console.error("[api/store]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
