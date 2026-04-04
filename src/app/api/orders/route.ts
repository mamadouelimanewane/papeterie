import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const order = await prisma.order.create({
      data: {
        orderId: "ORD-" + Math.floor(Math.random() * 100000),
        storeId: data.storeId,
        userId: data.userId || "temp-user-id", // Mocked for now
        total: data.total,
        status: "Pending", // Important for driver to see
        items: data.items,
        address: data.address,
      }
    });
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const orders = await prisma.order.findMany();
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}