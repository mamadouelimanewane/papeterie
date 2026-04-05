import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""

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
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
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
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
