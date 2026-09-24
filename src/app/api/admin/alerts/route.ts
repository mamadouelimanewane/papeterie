import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/** Compteurs pour la cloche de l'en-tête : ce qui attend une action de l'administrateur. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (isResponse(auth)) return auth
  try {
    const in30days = new Date(Date.now() + 30 * 86_400_000)
    const [pendingOrders, pendingDrivers, pendingCashouts, expiringDocs, latest] = await Promise.all([
      prisma.order.count({ where: { status: "Pending" } }),
      prisma.driver.count({ where: { approvalStatus: "Pending" } }),
      prisma.transaction.count({ where: { type: "Retrait", status: "Pending" } }),
      prisma.driverDocument.count({ where: { expiresAt: { lte: in30days } } }),
      prisma.order.findMany({ where: { status: "Pending" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, orderId: true, total: true, createdAt: true } }),
    ])
    return NextResponse.json({ pendingOrders, pendingDrivers, pendingCashouts, expiringDocs, latest })
  } catch (e) { return errorResponse(e) }
}
