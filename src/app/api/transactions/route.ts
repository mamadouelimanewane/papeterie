import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? "25"))
    const userId = searchParams.get("userId") ?? ""
    const driverId = searchParams.get("driverId") ?? ""
    const storeId = searchParams.get("storeId") ?? ""
    const type = searchParams.get("type") ?? ""

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (driverId) where.driverId = driverId
    if (storeId) where.storeId = storeId
    if (type) where.type = type

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({ transactions, total, page, perPage, totalPages: Math.ceil(total / perPage) })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (!data.amount || !data.type) {
      return NextResponse.json({ error: "amount et type sont requis" }, { status: 400 })
    }

    const tx = await prisma.transaction.create({
      data: {
        userId: data.userId ?? null,
        driverId: data.driverId ?? null,
        storeId: data.storeId ?? null,
        amount: Number(data.amount),
        type: data.type,
        method: data.method ?? "Cash",
        description: data.description ?? null,
        receiptNo: data.receiptNo ?? null,
        status: "Completed",
      },
    })

    // Update wallet balance
    const amount = data.type === "Credit" ? Number(data.amount) : -Number(data.amount)
    if (data.userId) {
      await prisma.user.update({
        where: { id: data.userId },
        data: { walletMoney: { increment: amount } },
      })
    }
    if (data.driverId) {
      await prisma.driver.update({
        where: { id: data.driverId },
        data: { walletMoney: { increment: amount } },
      })
    }

    return NextResponse.json(tx, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
