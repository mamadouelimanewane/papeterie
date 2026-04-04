import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, context: any) {
  try {
    const { params } = context; // Next 15 context parameter
    // Here id is the logic orderId like ORD-123. Let's find it.
    const orderToUpdate = await prisma.order.findFirst({ where: { orderId: params.id }});
    if(!orderToUpdate) throw new Error("Order not found");

    const order = await prisma.order.update({
      where: { id: orderToUpdate.id },
      data: { status: "Accepted", driverId: "temp-driver-id" }
    });
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}