import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDriver, isDriverError } from "@/lib/driverAuth"

/** PUT { lat, lng } : position GPS du livreur (suivi par le client et la carte de l'administration). */
export async function PUT(req: Request) {
  const driver = await requireDriver(req)
  if (isDriverError(driver)) return driver
  try {
    const { lat, lng } = await req.json().catch(() => ({}))
    const la = Number(lat), lo = Number(lng)
    if (lat === null || lng === null || lat === "" || lng === "" || !Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
      return NextResponse.json({ error: "Position invalide" }, { status: 400 })
    }
    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: { lastLocation: `${la},${lo}` },
    })
    return NextResponse.json({ success: true, lastLocation: updated.lastLocation })
  } catch (error) {
    console.error("[driver-location-put]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
