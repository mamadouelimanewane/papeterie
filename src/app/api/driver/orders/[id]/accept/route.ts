import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "papeterie-secret-2024-neon-pg"

async function getDriverId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = verify(authHeader.split(" ")[1], JWT_SECRET) as { id: string }
      return decoded.id
    } catch {}
  }
  return null
}

// POST /api/driver/orders/[id]/accept → accepter la commande
export async function POST(req: Request, context: any) {
  try {
    const params = context.params ?? {}
    const driverDbId = await getDriverId(req)
    const order = await prisma.order.findFirst({
      where: { OR: [{ orderId: params.id }, { id: params.id }] },
    })
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "Processing", driverId: driverDbId },
    })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/driver/orders/[id]/accept?status=Processing → mettre a jour le statut
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