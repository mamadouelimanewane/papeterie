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
      select: { walletMoney: true }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    return NextResponse.json({ balance: user.walletMoney })
  } catch (error) {
    console.error("[wallet-balance-get]", error)
    return NextResponse.json({ error: "Erreur serveur ou token invalide" }, { status: 500 })
  }
}
