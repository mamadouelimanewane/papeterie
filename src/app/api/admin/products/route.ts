import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"
import { parseProduct } from "@/lib/merchantApi"
import { getActiveStoreId } from "@/lib/store"
import { audit } from "@/lib/security/audit"

/** Catalogue (toutes boutiques) pour le back-office : recherche, filtre par catégorie / photo, pagination. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, "stores.view")
  if (isResponse(auth)) return auth
  try {
    const sp = new URL(req.url).searchParams
    const page = Math.max(1, Number(sp.get("page") ?? "1") || 1)
    const perPage = Math.min(100, Math.max(1, Number(sp.get("perPage") ?? "30") || 30))
    const search = (sp.get("search") ?? "").trim()
    const category = (sp.get("category") ?? "").trim()
    const photo = sp.get("photo") // "none" = sans photo, "own" = photo téléversée, "generic" = image illustrative

    const and: Prisma.ProductWhereInput[] = []
    if (search) {
      and.push({ OR: [
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ] })
    }
    if (category) and.push({ category })
    if (photo === "none") and.push({ image: null })
    if (photo === "own") and.push({ image: { startsWith: "/api/images/" } })
    if (photo === "generic") and.push({ OR: [{ image: { startsWith: "/generic/" } }, { image: { startsWith: "https://covers.openlibrary.org/" } }] })
    const where: Prisma.ProductWhereInput = and.length ? { AND: and } : {}

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ category: "asc" }, { name: "asc" }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: { id: true, name: true, price: true, stock: true, category: true, vatRate: true, description: true, image: true, status: true, barcode: true, store: { select: { name: true } } },
      }),
      prisma.product.count({ where }),
      prisma.product.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
    ])
    return NextResponse.json({
      products, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)),
      categories: categories.map((c) => c.category).filter(Boolean),
    })
  } catch (e) { return errorResponse(e) }
}

/** Création d'un produit dans la boutique active : { name, price, stock, category, description, status, barcode }. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, "stores.manage")
  if (isResponse(auth)) return auth
  try {
    const b = await req.json().catch(() => ({}))
    const parsed = parseProduct(b, false)
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 })
    const storeId = await getActiveStoreId()
    if (!storeId) return NextResponse.json({ error: "Aucune boutique active" }, { status: 400 })
    const product = await prisma.product.create({
      data: {
        storeId, name: parsed.name!, price: parsed.price!, stock: parsed.stock ?? 0,
        category: parsed.category ?? null, description: parsed.description ?? null, image: parsed.image ?? null,
        status: parsed.status ?? "Active", barcode: b.barcode ? String(b.barcode).trim().slice(0, 64) : null,
      },
    })
    await audit(req, auth, "product.create", product.name, { prix: product.price })
    return NextResponse.json(product, { status: 201 })
  } catch (e) { return errorResponse(e) }
}
