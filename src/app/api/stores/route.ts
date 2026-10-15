import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminTokenOrNull, errorResponse, isResponse, requireAdminApi } from "@/lib/adminAuth"
import { PUBLIC_STORE_SELECT } from "@/lib/storePublic"

/**
 * Liste des boutiques.
 * - Session admin (stores.view) : vue complète du back-office (solde, contacts, recherche par e-mail/téléphone).
 * - Public (vitrine, app client) : boutiques actives uniquement, champs vitrine seulement.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""
    const admin = await adminTokenOrNull(req, "stores.view")

    if (!admin) {
      const stores = await prisma.store.findMany({
        where: {
          status: "Active",
          ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
        },
        select: PUBLIC_STORE_SELECT,
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(stores)
    }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ]
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        _count: { select: { orders: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(stores)
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[stores-get]")
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const data = await req.json()
    if (!data.name || !data.email) {
      return NextResponse.json({ error: "name et email sont requis" }, { status: 400 })
    }

    const store = await prisma.store.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        address: data.address ?? null,
        image: data.image ?? null,
        serviceArea: data.serviceArea ?? null,
        segment: data.segment ?? "PAPETERIE",
        status: data.status ?? "Active",
      },
    })
    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[stores-post]")
  }
}
