import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) where.code = { contains: search, mode: "insensitive" }

    const codes = await prisma.promoCode.findMany({ where, orderBy: { createdAt: "desc" } })
    return NextResponse.json(codes)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (!data.code || data.discount === undefined) {
      return NextResponse.json({ error: "code et discount sont requis" }, { status: 400 })
    }
    const promo = await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        discount: Number(data.discount),
        type: data.type ?? "Percentage",
        maxUses: data.maxUses ? Number(data.maxUses) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        status: data.status ?? "Active",
      },
    })
    return NextResponse.json(promo, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
