import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isResponse, requireAdminApi, errorResponse } from "@/lib/adminAuth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const driver = await prisma.driver.findUnique({
      omit: { password: true },
      where: { id },
      include: { documents: true, orders: { orderBy: { createdAt: "desc" }, take: 10 } },
    })
    if (!driver) return NextResponse.json({ error: "Livreur introuvable" }, { status: 404 })
    return NextResponse.json(driver)
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[api/drivers/[id]]")
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    const data = await req.json()
    const allowed = ["name", "phone", "email", "serviceArea", "country", "status", "approvalStatus", "rejectionReason", "vehicleType", "walletMoney", "lastLocation", "deviceToken", "appVersion"]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }
    const driver = await prisma.driver.update({ where: { id }, data: update, omit: { password: true } })
    return NextResponse.json(driver)
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[api/drivers/[id]]")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req)
  if (isResponse(auth)) return auth
  try {
    const { id } = await params
    await prisma.driver.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, "Erreur serveur", "[api/drivers/[id]]")
  }
}
