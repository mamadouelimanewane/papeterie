import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/driver/orders/[id]/accept → accepter la commande (passe en Processing)
export async function POST(req: Request, context: any) {
  try {
    const params = context.params ?? {}
    const order = await prisma.order.findFirst({
      where: { OR: [{ orderId: params.id }, { id: params.id }] },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "Processing" },
    })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/driver/orders/[id]/accept → mettre a jour le statut
export async function PUT(req: Request, context: any) {
  try {
    const params = context.params ?? {}
    const body = await req.json().catch(() => ({}))
    const status = body.status ?? "Delivered"
    const order = await prisma.order.findFirst({
      where: { OR: [{ orderId: params.id }, { id: params.id }] },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status } })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}