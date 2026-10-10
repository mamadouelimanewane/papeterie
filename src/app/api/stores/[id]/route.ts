import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminTokenOrNull, errorResponse, isResponse, requireAdminApi } from "@/lib/adminAuth"
import { ADMIN_STORE_ORDER_SELECT, PUBLIC_STORE_SELECT } from "@/lib/storePublic"

/**
 * Détail d'une boutique.
 * - Public : boutique active, champs vitrine et produits actifs. Aucune commande.
 *   (Auparavant les 10 dernières commandes étaient renvoyées à tous, avec codes de livraison,
 *   noms, téléphones et adresses des clients.)
 * - Session admin (stores.view) : vue complète, commandes récentes sans codes OTP ni signature.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await adminTokenOrNull(req, "stores.view")

    if (!admin) {
      const store = await prisma.store.findFirst({
        where: { id, status: "Active" },
        select: {
          ...PUBLIC_STORE_SELECT,
          products: { where: { status: "Active" }, orderBy: { createdAt: "desc" }, take: 20 },
        },
      })
      if (!store) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })
      return NextResponse.json(store)
    }

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        products: { where: { status: "Active" }, orderBy: { createdAt: "desc" }, take: 20 },
        orders: { orderBy: { createdAt: "desc" }, take: 10, select: ADMIN_STORE_ORDER_SELECT },
        _count: { select: { orders: true, products: true } },
      },
    })
    if (!store) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })
    return NextResponse.json(store)
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[store-get]")
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const data = await req.json()
    // walletMoney n'est plus modifiable ici : le solde ne bouge que par des opérations tracées
    // (règlement de commande, retrait validé, ajustement via /api/admin/wallet).
    const allowed = ["name", "phone", "email", "address", "image", "status", "serviceArea", "loginUrl"]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }
    const store = await prisma.store.update({ where: { id }, data: update })
    return NextResponse.json(store)
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[store-patch]")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    await prisma.store.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[store-delete]")
  }
}
