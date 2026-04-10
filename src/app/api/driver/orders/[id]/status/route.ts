import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json()
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: params.id }, { orderId: params.id }] },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status } })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}