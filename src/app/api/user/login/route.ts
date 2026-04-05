import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sign } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "papeterie-secret-2024-neon-pg"

export async function POST(req: Request) {
  try {
    const { email, phone, password } = await req.json()

    if ((!email && !phone) || !password) {
      return NextResponse.json(
        { error: "Email/Téléphone et mot de passe sont requis" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      )
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      )
    }

    const token = sign(
      { id: user.id, userId: user.userId, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletMoney,
      }
    })
  } catch (error) {
    console.error("[login]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
