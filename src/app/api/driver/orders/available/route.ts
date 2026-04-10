import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: "Pending", driverId: null },
      include: { store: true, user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    const formatted = orders.map(o => ({
      id: o.orderId,
      _id: o.id,
      storeAddress: o.store?.address || "Boutique Dakar",
      deliveryAddress: o.address || "Adresse client",
      customerName: o.user?.name || "Client",
      customerPhone: o.user?.phone || "770000000",
      items: Array.isArray(o.items) ? (o.items as any[]).length : 1,
      distance: (Math.random() * 4 + 1).toFixed(1) + " km",
      earnings: o.earning || Math.floor(Number(o.total) * 0.1) || 500,
      total: o.total,
      storeName: o.store?.name || "Boutique",
    }))
    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}