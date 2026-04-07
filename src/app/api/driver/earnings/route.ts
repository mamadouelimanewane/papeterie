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
      select: { earning: true, totalOrders: true, walletMoney: true }
    })

    if (!driver) {
      return NextResponse.json({ error: "Livreur introuvable" }, { status: 404 })
    }

    // Calculer les revenus du jour (simulé pour l'instant par une fraction du total)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayOrdersCount = await prisma.order.count({
      where: {
        driverId: decoded.id,
        status: "Delivered",
        updatedAt: { gte: today }
      }
    })

    return NextResponse.json({
      totalEarnings: driver.earning,
      totalOrders: driver.totalOrders,
      walletBalance: driver.walletMoney,
      todayEarnings: todayOrdersCount * 500, // Simulation: 500 FCFA par livraison
      todayOrders: todayOrdersCount
    })
  } catch (error) {
    console.error("[driver-earnings-get]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
