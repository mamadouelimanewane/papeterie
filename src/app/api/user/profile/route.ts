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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        walletMoney: true,
        userType: true,
        status: true,
        registeredAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[user-profile-get]", error)
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
    const allowed = ["name", "phone", "email", "country"]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: update,
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        walletMoney: true,
        userType: true,
        status: true,
        registeredAt: true,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[user-profile-put]", error)
    return NextResponse.json({ error: "Erreur serveur ou token invalide" }, { status: 500 })
  }
}
