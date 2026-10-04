import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"

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
        select: { id: true, name: true, price: true, stock: true, category: true, image: true, status: true, barcode: true, store: { select: { name: true } } },
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
