import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

const CLOSED = ["Delivered", "Completed", "Cancelled"]

/** « lat,lng » envoyé par l'application livreur → coordonnées, ou null si absent / invalide. */
function parseLocation(s: string | null) {
  const [lat, lng] = (s ?? "").split(",").map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null
  return { lat, lng }
}

/**
 * Carte des livreurs en temps réel : livreurs approuvés, dernière position GPS transmise par
 * l'application, statut (en ligne / en livraison / hors ligne) et commande en cours.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, "drivers.view")
  if (isResponse(auth)) return auth
  try {
    const [drivers, active] = await Promise.all([
      prisma.driver.findMany({
        where: { approvalStatus: "Approved" },
        select: { id: true, name: true, phone: true, vehicleType: true, serviceArea: true, status: true, lastLocation: true, updatedAt: true },
        orderBy: { name: "asc" },
      }),
      prisma.order.findMany({
        where: { driverId: { not: null }, status: { notIn: CLOSED } },
        select: { driverId: true, orderId: true, address: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
    ])
    return NextResponse.json(drivers.map((d) => {
      const mine = active.filter((o) => o.driverId === d.id)
      return {
        id: d.id, name: d.name, phone: d.phone, vehicle: d.vehicleType, zone: d.serviceArea,
        position: parseLocation(d.lastLocation),
        lastSeen: d.updatedAt,
        state: mine.length ? "delivering" : d.status === "Online" ? "online" : "offline",
        orders: mine.map((o) => ({ orderId: o.orderId, address: o.address, status: o.status })),
      }
    }))
  } catch (e) { return errorResponse(e) }
}
