import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: "Pending" },
      include: { store: true }
    });
    // Formater pour coller aux attentes du mock driver existant
    const formatted = orders.map(o => ({
      id: o.orderId,
      _id: o.id,
      storeAddress: o.store?.address || "Address inconnue",
      deliveryAddress: o.address || "Client location",
      customerName: "Client " + (o.userId || "001"),
      customerPhone: "770000000",
      items: Array.isArray(o.items) ? o.items.length : 1,
      distance: "2.5 km",
      earnings: Math.floor(o.total * 0.1) || 500
    }));
    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}