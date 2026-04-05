import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) where.name = { contains: search, mode: "insensitive" }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json(categories)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (!data.name) return NextResponse.json({ error: "name est requis" }, { status: 400 })

    const category = await prisma.category.create({
      data: {
        name: data.name,
        segment: data.segment ?? "Papeterie",
        parentCategory: data.parentCategory ?? null,
        image: data.image ?? null,
        sequence: data.sequence ?? 1,
        status: data.status ?? "Active",
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
