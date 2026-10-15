import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isResponse, requireAdminApi, errorResponse } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
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
    return errorResponse(error, "Erreur serveur", "[api/notifications]")
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
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
    return errorResponse(error, "Erreur serveur", "[api/notifications]")
  }
}
