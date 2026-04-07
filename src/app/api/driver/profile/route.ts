import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "papeterie-secret-2024-neon-pg"

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verify(token, JWT_SECRET) as { id: string }

    const driver = await prisma.driver.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        driverId: true,
        name: true,
        email: true,
        phone: true,
        serviceArea: true,
        country: true,
        totalOrders: true,
        rating: true,
        earning: true,
        walletMoney: true,
        status: true,
        approvalStatus: true,
        vehicleType: true,
      }
    })

    if (!driver) {
      return NextResponse.json({ error: "Livreur introuvable" }, { status: 404 })
    }

    return NextResponse.json(driver)
  } catch (error) {
    console.error("[driver-profile-get]", error)
    return NextResponse.json({ error: "Erreur serveur ou token invalide" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verify(token, JWT_SECRET) as { id: string }

    const data = await req.json()
    const allowed = ["name", "phone", "email", "serviceArea", "country", "vehicleType"]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }

    const driver = await prisma.driver.update({
      where: { id: decoded.id },
      data: update,
      select: {
        id: true,
        driverId: true,
        name: true,
        email: true,
        phone: true,
        serviceArea: true,
        country: true,
        totalOrders: true,
        rating: true,
        earning: true,
        walletMoney: true,
        status: true,
        approvalStatus: true,
        vehicleType: true,
      }
    })

    return NextResponse.json(driver)
  } catch (error) {
    console.error("[driver-profile-put]", error)
    return NextResponse.json({ error: "Erreur serveur ou token invalide" }, { status: 500 })
  }
}
