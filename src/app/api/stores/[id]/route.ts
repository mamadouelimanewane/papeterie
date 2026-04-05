import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        products: { where: { status: "Active" }, orderBy: { createdAt: "desc" }, take: 20 },
        orders: { orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { orders: true, products: true } },
      },
    })
    if (!store) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })
    return NextResponse.json(store)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const allowed = ["name", "phone", "email", "address", "image", "status", "serviceArea", "walletMoney", "loginUrl"]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }
    const store = await prisma.store.update({ where: { id }, data: update })
    return NextResponse.json(store)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.store.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
