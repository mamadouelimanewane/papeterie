import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getActiveStoreId } from "@/lib/store"

const SHOP_CACHE_MS = 30_000
const SHOP_CACHE_HEADERS = {
  "Content-Type": "application/json",
  // 60 s en cache sur le CDN (puis 5 min de réponse « périmée » servie pendant le rafraîchissement) :
  // des milliers de visiteurs = une seule lecture de la base par minute et par région.
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
}
// Cache mémoire par instance : évite de relire et de re-sérialiser 800 produits à chaque visite.
let shopCache: { id: string; at: number; json: string } | null = null

/**
 * Renvoie LA boutique active (mode mono-boutique).
 * ?products=1 inclut le catalogue (produits actifs).
 * ?products=1&view=shop : version allégée et mise en cache pour la vitrine publique (champs affichés seulement).
 * Les autres appels (ex. /gestion, qui relit le stock juste après une modification) restent en direct.
 * Route publique : sert de vitrine au client.
 */
export async function GET(req: Request) {
  try {
    const id = await getActiveStoreId()
    if (!id) return NextResponse.json({ error: "Aucune boutique active configuree" }, { status: 404 })

    const params = new URL(req.url).searchParams
    const withProducts = params.get("products") === "1"
    const shopView = withProducts && params.get("view") === "shop"

    if (shopView && shopCache && shopCache.id === id && Date.now() - shopCache.at < SHOP_CACHE_MS) {
      return new Response(shopCache.json, { headers: SHOP_CACHE_HEADERS })
    }

    const store = await prisma.store.findUnique({
      where: { id },
      include: withProducts
        ? {
            products: {
              where: { status: "Active" },
              orderBy: { createdAt: "desc" },
              ...(shopView ? { select: { id: true, name: true, price: true, image: true, category: true, description: true, stock: true } } : {}),
            },
          }
        : undefined,
    })
    if (!store) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    if (shopView) {
      const json = JSON.stringify(store)
      shopCache = { id, at: Date.now(), json }
      return new Response(json, { headers: SHOP_CACHE_HEADERS })
    }
    return NextResponse.json(store)
  } catch (error) {
    console.error("[api/store]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
