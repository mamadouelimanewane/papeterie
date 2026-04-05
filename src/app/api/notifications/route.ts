import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") ?? ""

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(notifications)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (!data.title || !data.message) {
      return NextResponse.json({ error: "title et message sont requis" }, { status: 400 })
    }

    const notif = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        target: data.target ?? "All",
        imageUrl: data.imageUrl ?? null,
        status: "Draft",
      },
    })
    return NextResponse.json(notif, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
