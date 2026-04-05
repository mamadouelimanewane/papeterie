import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") ?? "10")))
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""
    const storeId = searchParams.get("storeId") ?? ""
    const dateFrom = searchParams.get("dateFrom") ?? ""
    const dateTo = searchParams.get("dateTo") ?? ""

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (storeId) where.storeId = storeId
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
      }
    }
    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: "insensitive" } },
        { invoiceId: { contains: search, mode: "insensitive" } },
        { userId: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          store: { select: { name: true, address: true } },
          driver: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, perPage, totalPages: Math.ceil(total / perPage) })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data.storeId || !data.total || !data.items) {
      return NextResponse.json({ error: "storeId, total et items sont requis" }, { status: 400 })
    }

    const orderId = "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000)
    const invoiceId = "INV-" + orderId.split("-")[1]

    const order = await prisma.order.create({
      data: {
        orderId,
        invoiceId,
        storeId: data.storeId,
        userId: data.userId ?? null,
        total: Number(data.total),
        subtotal: Number(data.subtotal ?? data.total),
        deliveryFee: Number(data.deliveryFee ?? 500),
        earning: Number(data.total) * 0.1,
        status: "Pending",
        paymentMethod: data.paymentMethod ?? "Cash",
        paymentStatus: "En attente",
        items: data.items,
        address: data.address ?? null,
        notes: data.notes ?? null,
      },
    })
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
