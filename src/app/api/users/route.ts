import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") ?? "10")))
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""
    const country = searchParams.get("country") ?? ""

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (country) where.country = country
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, perPage, totalPages: Math.ceil(total / perPage) })
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

    // Auto-increment userId
    const last = await prisma.user.findFirst({ orderBy: { userId: "desc" } })
    const userId = (last?.userId ?? 0) + 1

    const user = await prisma.user.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        country: data.country ?? null,
        userType: data.userType ?? "Retail",
        status: "Active",
      },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
