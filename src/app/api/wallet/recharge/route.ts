import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "papeterie-secret-2024-neon-pg"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verify(token, JWT_SECRET) as { id: string }

    const { amount } = await req.json()
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { walletMoney: { increment: Number(amount) } },
    })

    await prisma.transaction.create({
      data: {
        userId: decoded.id,
        amount: Number(amount),
        type: "Credit",
        method: "Recharge",
        description: "Recharge du portefeuille",
        status: "Completed",
      }
    })

    return NextResponse.json({ success: true, balance: user.walletMoney })
  } catch (error) {
    console.error("[wallet-recharge-post]", error)
    return NextResponse.json({ error: "Erreur serveur ou token invalide" }, { status: 500 })
  }
}
