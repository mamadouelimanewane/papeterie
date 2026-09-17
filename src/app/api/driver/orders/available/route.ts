import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: "Pending", driverId: null },
      include: { store: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    // Order.userId est un identifiant simple (pas de relation) : on resout les clients en une requete.
    const userIds = [...new Set(orders.map(o => o.userId).filter((v): v is string => !!v))]
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, phone: true },
        })
      : []
    const userMap = new Map(users.map(u => [u.id, u]))

    const formatted = orders.map(o => {
      const u = o.userId ? userMap.get(o.userId) : undefined
      return {
        id: o.orderId,
        _id: o.id,
        storeAddress: o.store?.address || "Boutique Dakar",
        deliveryAddress: o.address || "Adresse client",
        customerName: u?.name || "Client",
        customerPhone: u?.phone || "770000000",
        items: Array.isArray(o.items) ? (o.items as unknown[]).length : 1,
        distance: (Math.random() * 4 + 1).toFixed(1) + " km",
        earnings: o.earning || Math.floor(Number(o.total) * 0.1) || 500,
        total: o.total,
        storeName: o.store?.name || "Boutique",
      }
    })
    return NextResponse.json(formatted)
  } catch (error) {
    console.error("[driver-orders-available]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
